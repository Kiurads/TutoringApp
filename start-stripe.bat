@echo off
:: Open a new Command Prompt and run the Stripe listen command
start cmd /k "stripe listen -f localhost:3000/api/webhooks/stripe"