from flask import Flask, request
from flask_cors import CORS, cross_origin
import json

from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('nli-distilroberta-base-v2')
# Initializing varibles

# Queue of incoming messages
# Maintaining indexed messages in chronological order to deal with the window size.
queueOfSentences = []
ListOfIndividualCosines= []
currThreshold = 0.0
currCosineScore = 0.0
currentMessage = ""

# Current limit of sentences for calculating cosines.
MAX = 7

'''
JSON displayed on python3 appServer.py's output is the one sent from server.js.
i.e. it contains only the current name and message.

Similarly, npm start's output contains the returned JSON
'''
# Setup flask server
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Calculate the cosine score for the current message and return the score
# Also return the user name and chat messages back to node and append it there.
# Implement logic in js.
# Functions -- Start
def mergeSentences(queueOfSentences):
		mergedMsgPara = ""
		for i in queueOfSentences:
			mergedMsgPara = mergedMsgPara + i
		return mergedMsgPara

def compareCosines(currCosineScore,currThreshold):
	if(currCosineScore >= currThreshold):
		return True
	else:
		return False

def newThreshold(ListOfIndividualCosines):
	# ListOfIndividualCosines.append(currCosineScore)

	# Averaging cosines
	avgCosine = sum(ListOfIndividualCosines) / len(ListOfIndividualCosines)

	return (avgCosine - (avgCosine*0.45))

def popSentencesAndCosines():
	# When the length is greater than MAX i.e. 7 messages
	# Popping and creating space for new sentences and cosine scores
	queueOfSentences.pop(0)
	ListOfIndividualCosines.pop(0)

def mainLogic(currentMessage):
	global currThreshold
	print("Queue: ", queueOfSentences)
	# We'll use this to get the cosine
	mergedMsgPara = mergeSentences(queueOfSentences)

	# Converting sentences to embeddings
	mergedMsgPara_embed = model.encode(mergedMsgPara)
	currentMessage_embed = model.encode(currentMessage)

	# Calculating the cosine score
	currCosineScore = cosine_similarity([currentMessage_embed], [mergedMsgPara_embed]).flatten()
	# print("curr Score: ", currCosineScore)

	# Maintaining list of cosines
	# Note that the cosine score for the first two indexes is taken same. #Hardcoded.
	# ListOfIndividualCosines.append(currCosineScore)        

	acceptance = compareCosines(currCosineScore[0],currThreshold)
	print(acceptance)

	if(acceptance):
		queueOfSentences.append(currentMessage)
		ListOfIndividualCosines.append(currCosineScore)
		
		# Calculating new threshold
		currThreshold = newThreshold(ListOfIndividualCosines)
		print("New Threshold: ",currThreshold)
		return currThreshold[0],currCosineScore[0]
	else:
		# When the score is below par
		return currThreshold[0],currCosineScore[0]

# Functions -- End
@app.route('/getCosineScore', methods = ['POST'])
@cross_origin()
def cosineScore():
	# Getting the current message
	data = request.get_json()
	# data = request.form
	print(data)

	# Data variables contains the data sent from the node server (User chat and name)
	currentUser = data['currUser']
	currentMessage = data['currMessage']
	print("Current Message", currentMessage)
	
	# Updated Logic -- START
	
	# Main logic
	# Base case, when we get the first message
	if(len(queueOfSentences) == 0):
		queueOfSentences.append(currentMessage)
		# Things to return
		sendBackforMore = {
			"User"			:	currentUser,
			"Message"		:	currentMessage,
			"CosineScore" 	: 	str(2)
		}
		return json.dumps(sendBackforMore)
		# return None
	elif(len(queueOfSentences) <= MAX):
		# Things to return
		threshold, cosine = mainLogic(currentMessage)
		sendBackforMore = {
			"User"			:	currentUser,
			"Message"		:	currentMessage,
			"CosineScore" 	: 	str(cosine),
			"Threshold" 	: 	str(threshold)
		}
		return json.dumps(sendBackforMore)
	else:
		popSentencesAndCosines()
		# Things to return
		threshold, cosine = mainLogic(currentMessage)
		sendBackforMore = {
			"User"			:	currentUser,
			"Message"		:	currentMessage,
			"CosineScore" 	: 	str(cosine),
			"Threshold" 	: 	str(threshold)
		}
		return json.dumps(sendBackforMore)
	# Python Code --- ENDS
	# Return data in json format to node i.e. to our front end
	# Will return cosine score and grades for users

if __name__ == "__main__":
	app.run(host='0.0.0.0',port=5000)
