from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from mtgsdk import Card, Set
from utils.magic_card import MagicCard
from json import dumps

app = Flask(__name__)

#create list for set names once then never again
#Not sure if this is considered global among sessions
sets = Set.all()
set_names = []
for s in sets:
    set_names.append(s.name)
del sets

#very secure, required for session data
app.secret_key = "test"

@app.route('/search/page/<int:page>', methods=['GET', 'POST'])
def search(page):
    if(page < 1):
        return redirect(url_for('not_found'))

    #create a draft_deck if it doesn't exist
    if('draft_deck' not in session):
        session['draft_deck'] = {}
        session['draft_deck']['count'] = 0

    #get string querys from url to use for search
    name = request.args.get('name')
    color = request.args.get('color')
    set_name = request.args.get('set')
    card_type = request.args.get('type')

    #search using the mtgapi
    cards = Card.where(name=name,
            page=page,
            types=card_type,
            colors=color,
            setName=set_name,
            contains='multiverseId').where(pageSize=10).all()

    session['cache'] = {}
    for card in cards:
        session['cache'].update(MagicCard(card).to_dict())

    #handle pagination
    hasPrev = False
    hasNext = False
    if(page > 1):
        hasPrev = True
    nextPageCards = Card.where(
            name=name,
            page=page+1,
            types=card_type,
            colors=color,
            setName=set_name,
            contains='multiverseId').where(pageSize=10).all()
    if(len(nextPageCards) > 0):
        hasNext = True

    return render_template('editcollection.html', set_names=set_names, cards=cards, hasNext=hasNext, hasPrev=hasPrev, page=page)

@app.route('/')
def index():
    return render_template('index.html')
    #return redirect(url_for('search', page=1), code=302)

@app.route('/add', methods=['POST'])
def add_card():
    if('draft_deck' not in session):
        print('creating draft deck')
        session['draft_deck'] = {}
        session['draft_deck']['count'] = 0

    add_card = request.form.get('add_card')
    if(add_card and request.method == 'POST'):
        if(add_card in session['cache']):
            if(add_card not in session['draft_deck']):
                if('count' not in session['draft_deck']):
                    session['draft_deck']['count'] = 0
                tmp = {}
                tmp[add_card] = {}
                tmp[add_card].update(session['cache'][add_card])
                session['draft_deck'].update(tmp)
            else:
                session['draft_deck'][add_card]['count'] += 1
            session['draft_deck']['count'] += 1
            session.modified = True
            return jsonify({'success' : dumps(session['draft_deck'])})
        elif(add_card in session['draft_deck']):
            session['draft_deck'][add_card]['count'] += 1
            session['draft_deck']['count'] += 1
            session.modified = True
            return jsonify({'success' : dumps(session['draft_deck'])})
    return jsonify({'error': 'failed to add'})


@app.route('/sub', methods=['POST'])
def sub_card():
    if('draft_deck' not in session):
        return jsonify({'error': 'No cards to subtract'})

    sub_card = request.form.get('sub_card')
    if(sub_card and request.method == 'POST'):
        if(sub_card not in session['draft_deck']):
            return jsonify({'error': 'Card not found in deck'})
        else:
            if(session['draft_deck'][sub_card]['count'] == 1):
                del session['draft_deck'][sub_card]
            elif(session['draft_deck'][sub_card]['count'] > 1):
                session['draft_deck'][sub_card]['count'] -= 1
            session['draft_deck']['count'] -= 1
            session.modified = True
            return jsonify({'success' : dumps(session['draft_deck'])})

@app.route('/fetch', methods=['POST'])
def fetch():
    if('draft_deck' in session):
        return jsonify({'success' : dumps(session['draft_deck'])})
    else:
        return jsonify({'error': 'Nothing to fetch'})

@app.route('/clear', methods=['POST'])
def clear():
    session['draft_deck'] = {}
    session['draft_deck']['count'] = 0
    session.modified = True
    return jsonify({'success' : dumps(session['draft_deck'])})

@app.route('/sealed')
def sealed():
    return render_template('sealed.html')

@app.route('/invalid')
def not_found():
    #needs legit page
    return "404: Page not found"

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True)

