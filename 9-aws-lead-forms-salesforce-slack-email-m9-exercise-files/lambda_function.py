import json
import boto3

print('Loading function')
 
 
def lambda_handler(event, context):
    
    sqs = boto3.resource('sqs')    
    
    fqueue = sqs.get_queue_by_name(QueueName='leadData')
    mes = json.dumps(event, indent=2)
    fqueue.send_message(MessageBody=mes)

    return mes#alternatively return "Submitted!"
    