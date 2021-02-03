import serverless_wsgi
import {{django_project}}.wsgi

def handler(event, context):
    return serverless_wsgi.handle_request({{django_project}}.wsgi.application, event, context)
