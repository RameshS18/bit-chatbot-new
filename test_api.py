import urllib.request as r
import json
import sys

req = r.Request('http://127.0.0.1:5000/direct-login', 
    data=json.dumps({'name':'t','phone':'1234567890'}).encode(), 
    headers={'Content-Type':'application/json'})

try:
    resp = r.urlopen(req)
    print(resp.read().decode())
except Exception as e:
    print(e)
    if hasattr(e, 'read'):
        print(e.read().decode())
