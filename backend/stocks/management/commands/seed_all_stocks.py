
import pandas as pd
import os
from django.core.management.base import BaseCommand
from stocks.models import Stock
from django.conf import settings
import yfinance as yf
from decimal import Decimal
import time

class Command(BaseCommand):
    help = 'Seeds the database with both India and US stocks and fetches real-time data from yfinance'

    def update_stock_data(self, stock):
        """Helper to fetch and update stock data from yfinance"""
        try:
            ticker = yf.Ticker(stock.symbol)
            info = ticker.info
            
            # Current Price
            price = info.get('currentPrice') or info.get('regularMarketPrice')
            if price:
                stock.current_price = Decimal(str(price))
            
            # PE Ratio
            pe = info.get('trailingPE') or info.get('forwardPE')
            if pe:
                stock.pe_ratio = Decimal(str(pe))
            
            # Discount Ratio (using target price)
            target = info.get('targetMeanPrice')
            if target and price:
                discount = ((float(target) - float(price)) / float(target)) * 100
                stock.discount_ratio = Decimal(str(round(discount, 2)))
            
            stock.save()
            return True
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error fetching data for {stock.symbol}: {str(e)}"))
            return False

    def handle(self, *args, **options):
        root_dir = settings.BASE_DIR.parent
        india_file = os.path.join(root_dir, 'ind_nifty200list.csv')
        us_file = os.path.join(root_dir, 'USA Top 200 Stocks.xlsx')

        self.stdout.write(self.style.WARNING(f"Starting seed process. Files: {india_file}, {us_file}"))

        all_stocks_to_update = []

        # 1. Process India Stocks (NSE)
        if os.path.exists(india_file):
            self.stdout.write(self.style.SUCCESS(f"Importing India stocks..."))
            try:
                df = pd.read_csv(india_file)
                for _, row in df.iterrows():
                    symbol = f"{row['Symbol']}.NS"
                    stock, created = Stock.objects.get_or_create(
                        symbol=symbol,
                        defaults={
                            'name': row['Company Name'],
                            'exchange': 'NSE',
                            'sector': row['Industry'],
                            'currency': 'INR'
                        }
                    )
                    all_stocks_to_update.append(stock)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error importing India stocks: {str(e)}"))

        # 2. Process US Stocks (NYSE/NASDAQ)
        if os.path.exists(us_file):
            self.stdout.write(self.style.SUCCESS(f"Importing US stocks..."))
            try:
                df = pd.read_excel(us_file)
                for _, row in df.iterrows():
                    symbol = row['Symbol']
                    stock, created = Stock.objects.get_or_create(
                        symbol=symbol,
                        defaults={
                            'name': row['Company'],
                            'exchange': 'NYSE',
                            'sector': row.get('Sector', 'N/A'),
                            'currency': 'USD'
                        }
                    )
                    all_stocks_to_update.append(stock)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error importing US stocks: {str(e)}"))

        # 3. Update Real-time Data
        total = len(all_stocks_to_update)
        self.stdout.write(self.style.WARNING(f"Updating real-time data for {total} stocks (this may take a while)..."))
        
        updated_count = 0
        for i, stock in enumerate(all_stocks_to_update):
            if self.update_stock_data(stock):
                updated_count += 1
            
            if (i + 1) % 10 == 0:
                self.stdout.write(f"Processed {i+1}/{total} stocks...")
            
            # Small delay to avoid yfinance rate limits
            time.sleep(0.05)

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {total} stocks. Real-time data updated for {updated_count} stocks."))
