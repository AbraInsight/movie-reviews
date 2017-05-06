from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO
import os
import time
import sqlite3 as lite
from datetime import datetime
from threading import Timer
import tweepy
import simplejson as json

dictP = ["good", "like", "love", "want to see", "need to see", "need to watch", "great", "excellent", "great"]
dictN = ["sad", "hate", "spoil", "died", "really shock", "sick"]

# Variables that contains the user credentials to access Twitter API
access_token = "842083082903687169-SSiCI6qC2YsiMM1HFRSBQxIQUYxnWy7"
access_token_secret = "vZmQimUxXG1l16L9KrRyYdvpzMrdYGZWYshk0bPBjor3G"
consumer_key = "08yT73R6do9SPepF2uwHuortf"
consumer_secret = "GdkLpRHdQa31vLbOJRAXxWjYwsdByjifM2znvaTjusEKDowQAA"

tweet_collection = []
log = []
con = None

app = Flask(__name__)
socket = SocketIO(app)

def isDead():
    global log
    if sum(log) == 0:
        os._exit(0)

def add_row_to_db(dt, table_name, summed, num):
    # print dt, film, summed, num

    con = lite.connect("tweet.db")
    cursor = con.cursor()
    cursor.execute("INSERT INTO " + table_name + " VALUES(?,?,?)", (dt, summed, num))
    con.commit()
    con.close()

def processing(film, pro):
    global log

    table_name = film.replace(" ", "_").replace("'", "")

    dt = int(time.mktime(datetime.now().timetuple()))
    twit = ",".join(pro)
    pos = sum(map(twit.lower().count, (dictP)))
    neg = sum(map(twit.lower().count, (dictN)))
    summed = pos - neg
    num = len(pro)

    log.append(num)
    if len(log) > 40:
        log.pop(0)
        isDead()

    add_row_to_db(dt, table_name, summed, num)
    socket.emit('message', {"film": table_name, "data": [dt, summed, num]}, json=True, namespace='/api/realtime/update')



def go(flag=False):
    global tweet_collection
    films = ["lady macbeth", "dog's purpose", "king arthur", "logan"]

    offset = int(time.mktime(datetime.now().timetuple())) % 60
    Timer(60 - offset, go).start()

    # make a copy so we can clear
    temp = tweet_collection[:]
    tweet_collection = []

    if flag == False:
        for film in films:
            filtered = []
            for line in temp:
                if film in line.lower():
                    filtered.append(line)
            processing(film, filtered)

    else:
        print 'RUNNING...'


class StdOutListener(tweepy.streaming.StreamListener):

    def on_connect(self):
        offset = int(time.mktime(datetime.now().timetuple())) % 60
        Timer(60 - offset, lambda: go(True)).start()
        # Timer(0, lambda: go(True)).start() #DEBUG!

    def on_data(self, data):
        global tweet_collection
        try:
            json_load = json.loads(data)
            text = json_load["text"].encode(
                "utf-8").replace('\n', ' ').replace('\t', ' ').replace('\r', ' ')
            tweet_collection.append(text)

        except KeyError:
            print data
        return True

    def on_error(self, status):
        print status

con = lite.connect("tweet.db")
cursor = con.cursor()
cursor.execute("DROP TABLE IF EXISTS lady_macbeth")
cursor.execute("DROP TABLE IF EXISTS dogs_purpose")
cursor.execute("DROP TABLE IF EXISTS king_arthur")
cursor.execute("DROP TABLE IF EXISTS logan")
cursor.execute("CREATE TABLE lady_macbeth(dt INT, summed INT, num INT)")
cursor.execute("CREATE TABLE dogs_purpose(dt INT, summed INT, num INT)")
cursor.execute("CREATE TABLE king_arthur(dt INT, summed INT, num INT)")
cursor.execute("CREATE TABLE logan(dt INT, summed INT, num INT)")
con.close()

# This handles Twitter authetification and the connection to Twitter
# Streaming API
l = StdOutListener()
auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)
stream = tweepy.Stream(auth, l)

# This line filters Twitter streams to capture data by the keywords
stream.filter(languages=["en"], track=["lady macbeth", "dog's purpose", "king arthur", "logan"], async=True)
# stream.filter(languages=["en"], track=['#photography'], async=True) #DEBUG!
print 'INIT....'

if __name__ == '__main__':
    socket.run(app, port=4200)