#!/bin/bash
cd /Users/rs/todo-board
npm start &
sleep 1
open http://localhost:3001
echo "Todo Board running at http://localhost:3001"
echo "Press Ctrl+C to stop"
wait
