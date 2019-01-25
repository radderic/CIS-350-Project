from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from mtgsdk import Card, Set

app = Flask(__name__)

#create list for set names once then never again
#Not sure if this is considered global among sessions
print('getting all sets by name')
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

    if('draft_deck' not in session):
        session['draft_deck'] = []

    name = request.args.get('name')
    color = request.args.get('color')
    set_name = request.args.get('set')
    card_type = request.args.get('type')

    #Need multiverseId for searching, otherwise you get duplicates AND it's a unique id for each card which we want
    cards = Card.where(name=name, page=page, types=card_type, colors=color, setName=set_name, contains='multiverseId').where(pageSize=10).all()

    hasPrev = False
    hasNext = False
    if(page > 1):
        hasPrev = True
    nextPageCards = Card.where(name=name, page=page+1, types=card_type, colors=color, setName=set_name, contains='multiverseId').where(pageSize=10).all()
    if(len(nextPageCards) > 0):
        hasNext = True

    return render_template('base.html', set_names=set_names, cards=cards, hasNext=hasNext, hasPrev=hasPrev, page=page, session_deck=session['draft_deck'])

@app.route('/')
def index():
    return redirect(url_for('search', page=1, name=''), code=302)

@app.route('/add', methods=['POST'])
def add_card():
    if('draft_deck' not in session):
        session['draft_deck'] = []

    add_card = request.form.get('add_card')
    if(add_card and request.method == 'POST'):
        session['draft_deck'].append(add_card)
        session.modified = True
        print('updated deck:', session['draft_deck'])
        return jsonify({'success' : session['draft_deck']})

    return jsonify({'error': 'failed to add'})


@app.route('/clear', methods=['POST'])
def clear():
    session['draft_deck'] = []
    return jsonify({'success' : session['draft_deck']})

@app.route('/simulate')
def simulate():
    return "TODO"

@app.route('/invalid')
def not_found():
    #needs legit page
    return "404: Page not found"

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True)

