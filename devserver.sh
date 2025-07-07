#!/bin/sh
source .venv/bin/activate
python mysite/apiBack/manage.py runserver $PORT
