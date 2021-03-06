// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();


 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  // tslint:disable-next-line:no-shadowed-variable
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  // tslint:disable-next-line:no-shadowed-variable
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
}

// tslint:disable-next-line:no-shadowed-variable
function readFromDb (agent) {
  // Get the database collection 'dialogflow' and document 'agent'
  const patientId = 'CNB2KC1iqGKFS1agt6Y2';
  const dialogflowAgentDoc = db.collection('Patients').doc(patientId);

  agent.add('So far so good');
  // Get the value of 'entry' in the document and send it to the user
  return dialogflowAgentDoc.get()
    .then(doc => {
      if (!doc.exists) {
        agent.add('No data found in the database!');
      } else {
        agent.add(doc.data().Email);
        agent.add(doc.data()['First Name']);
      }
      return Promise.resolve('Read complete');
    }).catch(() => {
      agent.add('Error reading entry from the Firestore database.');
      agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
    });
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

// tslint:disable-next-line:no-shadowed-variable
function getMedicationInformation(agent) {
  const drugName = agent.parameters.medications;
  const medications = db.collection('medications').doc(drugName);
  
  medications.get().then(function(doc) {
    if (doc.exists) {
        console.log("Document data:", doc.data());
        agent.add(doc.data().Description);
    } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
        agent.add("I don't know about " + drugName);
    }
  }).catch(function(error) {
      console.log("Error getting document:", error);
  });
  

}

// tslint:disable-next-line:no-shadowed-variable
function getMedicationSchedule (agent) {

  const patientId = 'CNB2KC1iqGKFS1agt6Y2';
  const dialogflowAgentDoc = db.collection('Patients').doc(patientId);
  const messages = db.collection('messages');
  const patient = db.collection('Patients').doc(patientId);

  // const citiesRef = db.collection('messages');
  // const allCities = citiesRef.get()
  //     .then(snapshot => {
  //       snapshot.forEach(doc => {
  //         agent.add(doc.data().message);
  //         console.log(doc.id, '=>', doc.data());
  //       });
  //     })
  //     .catch(err => {
  //       agent.add('Error');
  //       console.log('Error getting documents', err);
  //     });
  
  return patient.get()
    .then(doc => {
      if(!doc.exists) {
        agent.add('No medications scheduled');
      } else {
        agent.add('Your medications for today are:');
        patient.collection("Medications").get()
          .then(snapshot => {
            
            agent.add(snapshot[0].data().Name);

            // snapshot.forEach(medication => {
            //   console.log(medication.data().Name);
            //   agent.add(medication.data().Name);
            // });

            console.log('read complete');
            agent.add('help');

            return Promise.resolve('Read complete');

            
            
          }).catch( err => {
            console.log(err);
          });
      }
      }).catch((err) => {
      console.log(err)
    })

  //     // Get reference to all of the documents
  // console.log("Retrieving list of documents in collection");
  // let documents = collectionRef.limit(1).get()
  //   .then(snapshot => {
  //     snapshot.forEach(doc => {
  //       console.log("Parent Document ID: ", doc.id);

  //       let subCollectionDocs = collectionRef.doc(doc.id).collection("subCollection").get()
  //         .then(snapshot => {
  //           snapshot.forEach(doc => {
  //             console.log("Sub Document ID: ", doc.id);
  //           })
  //         }).catch(err => {
  //           console.log("Error getting sub-collection documents", err);
  //         })
  //     });
  //   }).catch(err => {
  //   console.log("Error getting documents", err);
  // });


    // return messages.get()
    //   .then(snapshot => {
    //     snapshot.forEach(doc => {
    //       if (!doc.exists) {
    //         agent.add('No data found in the database!');
    //       } else {
    //         agent.add(doc.data().message);
    //       }
    //     });
    //     return Promise.resolve('Read complete');
    //   }).catch(() => {
    //     agent.add('Error reading entry from the Firestore database.');
    //     agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
    //   });

  // agent.add('done');


  // const query = db.collection('Patients');
  // agent.add('Having a look...');
  // query.get().then(querySnapshot => {
  //   querySnapshot.forEach(documentSnapshot => {
  //     agent.add(`Found document at ${documentSnapshot.ref.path}`);
  //   });
  // });
  // agent.add('That is all I found');



  // return dialogflowAgentDoc.get()
  //   .then(doc => {
  //     if (!doc.exists) {
  //       agent.add('No data found in the database!');
  //     } else {
  //       agent.add(doc.data().entry);
  //       // agent.add(doc.data().entry);
  //     }
  //     return Promise.resolve('Read complete');
  //   }).catch(() => {
  //     agent.add('Error reading entry from the Firestore database.');
  //     agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
  //   });
}

// tslint:disable-next-line:no-shadowed-variable
function writeToDb (agent) {
  // Get parameter from Dialogflow with the string to add to the database
  const databaseEntry = agent.parameters.databaseEntry;

  // Get the database collection 'dialogflow' and document 'agent' and store
  // the document  {entry: "<value of database entry>"} in the 'agent' document
  const dialogflowAgentRef = db.collection('dialogflow').doc('agent');
  return db.runTransaction(t => {
    t.set(dialogflowAgentRef, {entry: databaseEntry});
    return Promise.resolve('Write complete');
  }).then(doc => {
    agent.add(`Wrote "${databaseEntry}" to the Firestore database.`);
  }).catch(err => {
    console.log(`Error writing to Firestore: ${err}`);
    agent.add(`Failed to write "${databaseEntry}" to the Firestore database.`);
  });
}

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // tslint:disable-next-line:no-shadowed-variable
  function yourFunctionHandler(agent) {
    agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
    agent.add(new Card({
         title: `Title: this is a card title`,
         imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
         text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
         buttonText: 'This is a button',
         buttonUrl: 'https://assistant.google.com/'
       })
     );
     agent.add(new Suggestion(`Quick Reply`));
     agent.add(new Suggestion(`Suggestion`));
     agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
   }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  const intentMap = new Map();
  // intentMap.set('Default Welcome Intent', welcome);
  // intentMap.set('Default Fallback Intent', fallback);
     intentMap.set('get me some data', readFromDb);
     intentMap.set('save me some data', writeToDb);
     intentMap.set('get medication schedule', getMedicationSchedule)
     intentMap.set('Drug Information', getMedicationInformation);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
