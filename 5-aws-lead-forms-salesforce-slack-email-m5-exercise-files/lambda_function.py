import boto3
        
def lambda_handler(event, context):
    if not ('email' in event):
        return {"code": 1, "message": "Must provide an email"}
    
    toEmail = event['email']
    fromEmail = "<USE VERIFIED EMAIL ADDRESS>"
    replyTo = event['email']
    name = event['first_name']
    subject = "Thank you - " + name
    message = "Here is some valuable marketing information!"

    client = boto3.client('ses')
    response = client.send_email(
		Source=fromEmail,
		Destination={
			'ToAddresses': [
				toEmail,
			],
		},
		Message={
			'Subject': {
				'Data': subject,
				'Charset': 'utf8'
			},
			'Body': {
				'Text': {
					'Data': message,
					'Charset': 'utf8'
				}
			}
		},
		ReplyToAddresses=[
			replyTo
		]
	)
		
    print response['MessageId']
    return {'code': 200, 'message': 'Success'}