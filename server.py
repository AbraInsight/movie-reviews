from flask import Flask, jsonify, render_template, request
import sqlite3 as lite
import time
from datetime import datetime, timedelta
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('reviews.html', page={'title': 'Movie Reviews'})

@app.route('/docs')
def docs():
    return render_template('docs.html', page={'title': 'Documentation'})

@app.route('/api/realtime/init/', methods=['GET'])
def api_realtime_init():
    
    period = request.args.get('period')
    
    con = lite.connect("tweet.db")
    cursor = con.cursor()
    dt = datetime.now() - timedelta(hours=int(period), minutes=1)
    dt = int(time.mktime(dt.timetuple()))

    films = ['dogs_purpose', 'king_arthur', 'lady_macbeth', 'logan']
    data = {}

    for film in films:
        cursor.execute("SELECT dt, summed, num FROM " + film + " WHERE dt >= ? ORDER BY dt ASC", (dt,))
        data[film] = cursor.fetchall()

    con.close()
    return jsonify(data)

if __name__ == '__main__':
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.run()