[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/bzPrOe11)
# CS3219 Project (PeerPrep) - AY2425S1
## Group: G44

### Running PeerPrep
Before you run PeerPrep, please check the `.env` file in the root directory, and modify the IP address/URL and/or ports if necessary. It should look something like this:
```sh
# URLs - change these to your local or cloud deployment IP address/URL if necessary
PUBLIC_URL=http://localhost
WS_PUBLIC_URL=ws://localhost

# Port numbers - change these if you are already using these ports for other (non-PeerPrep) services
FRONTEND_PORT=3000
QUESTION_API_PORT=2000
USER_API_PORT=3001
MATCHING_API_PORT=3002
COLLAB_API_PORT=3003
```

Then, in the root directory, run
```sh
docker compose up -d
```
and access PeerPrep at [localhost:3000](http://localhost:3000), or the IP address/URL you set earlier in the `.env` file

> To force a rebuild of the images, run
> `docker compose up -d --build`

#### Developing
If you are developing PeerPrep, you can use [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/) to automatically update and preview code changes:
```sh
docker compose up --watch --build
```

### API Endpoints
#### Question Service
The question microservice exposes the following API endpoints:
- ```questions/all``` - Returns all the questions available on the database.
- ```questions/byId/[Question ID]``` - Returns a single question by ID number.
- ```questions/maxQuestionId``` - Returns the highest question ID currently being stored in the database. (Can be used for adding new Questions).
- ```filter/q/?categories=Arrays,Bit%20Manipulation&complexities=Easy,Medium&keywords=algebra,geometry``` - Returns all questions that have Arrays AND/OR Bit Manipulation tags, are either Easy OR Medium, and contain the keywords "algebra" or "geometry".
- ```questions/add``` - Adds a new question to the database.
- ```questions/delete/[Question ID]``` - Deletes a question from the database by ID number.
- ```questions/update/[Question ID]``` - Updates a question from the database by ID number.
- ```questions/patch/[Question ID]``` - Patches a question from the database by ID number.
- `questions/byObjectId/[Question ObjectId]` - Returns a single question by its MongoDB ObjectId.
- `questions/batch` - Accepts a POST request with a JSON array of ObjectIds and returns multiple questions by their IDs.

#### Matching Service
The matching microservice exposes the following API endpoint (via a WebSocket connection):
- ```/``` - Persistently opens a connection to the service.

Message Protocol (JSON):

**Note**: WebSocket only sends strings, so use ```JSON.stringify()``` to convert your JS request objects into strings (and ```JSON.parse()``` to parse responses) when communicating via WebSocket.<br>

1. To enqueue a user:
```
{
  event: "enqueue",
  userId: <ID of the user>,
  questions: [<Array containing question IDs.>]
}
```
Replies with:

- On successful match within 30s:
```
{
  event: "match-success",
  userId: <ID of this user>,
  peerUserId: <ID of the other user>,
  agreedQuestion: <The question that has been agreed upon by both users>
}
```
- On timeout after 30s (no match found):
```
{
   event: "match-timeout",
   userId: <ID of this user>
}
```
2. To dequeue a user:
- Replies with an ```dequeue-success``` event.
```
{
  "event": "dequeue",
  "userId": <ID of this user>,
}
```

### Note: 
- You can choose to develop individual microservices within separate folders within this repository **OR** use individual repositories (all public) for each microservice. 
- In the latter scenario, you should enable sub-modules on this GitHub classroom repository to manage the development/deployment **AND** add your mentor to the individual repositories as a collaborator. 
- The teaching team should be given access to the repositories as we may require viewing the history of the repository in case of any disputes or disagreements. 
