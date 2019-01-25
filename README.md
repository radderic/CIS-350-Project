# CIS-350-Project
Card drafting simulator

## Requirements

[Python 3.4 or higher](https://www.python.org/downloads/)

[Flask](http://flask.pocoo.org/) :

    pip install flask

[mtgsdk](https://docs.magicthegathering.io/) :

    pip install mtgsdk

Optional but recommended:

    pip install virtualenv

## Running

For debugging set the environmental variable FLASK\_ENV to develpment
as well as setting FLASK\_APP to app.py

On linux:

    export FLASK_ENV=development
    export FLASK_APP=app.py

Then you man execute

    flask run

If it worked it should be running at localhost:5000 (127.0.0.1:5000)

## About

This is web application that uses Flask for a backend

### Backend

* Routing
* Accessing the mtg api database: https://docs.magicthegathering.io/
* Storing information in the users session
* Sending templates(html) processed with jinja

### Frontend:
Javascript

* Jquery for ajax
* Jquery for other interactive elements (nothing yet)
* handle the deck simulation

HTML/CSS

* Jinja rendered html/css documents
* Ideally use flexbox
