#!/bin/bash
service nginx start
cd /app && node server.js
tail -f /dev/null
