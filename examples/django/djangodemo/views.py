import os
import json
from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.

def index(request):
    return render(request, 'index.html', context={'hello': 'world'})

def author(request):
    return HttpResponse("Tencent Cloud Serverless Team")

# 获取函数 event
def event(request):
    event = os.environ.get("__SLS_EVENT__")
    event = json.loads(event)
    msg = {
      "globalEvent": event,
      "requestEvent": request.environ.get("event")
    }
    return HttpResponse(json.dumps(msg), content_type="application/json")
