#!/bin/bash

echo "🚀 Actualizando proyecto..."

cd /var/www/living-lab || exit

git pull origin main

echo "📦 Backend..."
cd backend
npm install
npm run build
pm2 restart livinglab-backend

echo "🌐 Frontend..."
cd ../frontend
npm install
npm run build

sudo rm -rf /var/www/html/livinglab/*
sudo cp -r dist/* /var/www/html/livinglab/

echo "✅ Deploy listo"
