import 'package:flutter/material.dart';
import 'package:googleapis/dialogflow/v2.dart';
import 'package:googleapis_auth/auth_io.dart';
import 'package:flutter/services.dart';
import 'package:firebase_messaging/firebase_messaging.dart';




void main() => runApp(new MyApp());


class MyApp extends StatelessWidget {
  @override
  
  
  Widget build(BuildContext context) {
    return new MaterialApp(
      title: 'DigiRoo Demo',
      theme: new ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: new ChatMessages(),
    );
  }
}




class ChatMessages extends StatefulWidget {
  @override
  _ChatMessagesState createState() => _ChatMessagesState();
}

class _ChatMessagesState extends State<ChatMessages>
    with TickerProviderStateMixin {
  List<ChatMessage> _messages = List<ChatMessage>();
  bool _isComposing = false;

  TextEditingController _controllerText = new TextEditingController();

  DialogflowApi _dialog;

  @override
  void initState() {
    super.initState();
    _initChatbot();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: new AppBar(title: new Text("MediRoo")),
        body: Column(
          children: <Widget>[
            _buildList(),
            Divider(height: 8.0, color: Theme.of(context).accentColor),
            _buildComposer()
          ],
        ));
  }

  _buildList() {
    return Flexible(
      child: ListView.builder(
          padding: EdgeInsets.all(8.0),
          reverse: true,
          itemCount: _messages.length,
          itemBuilder: (_, index) {
            return Container(child: ChatMessageListItem(_messages[index]));
          }),
    );
  }

  _buildComposer() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 8.0),
      child: Row(
        children: <Widget>[
          Flexible(
            child: TextField(
              controller: _controllerText,
              onChanged: (value) {
                setState(() {
                  _isComposing = _controllerText.text.length > 0;
                });
              },
              onSubmitted: _handleSubmit,
              decoration: InputDecoration.collapsed(hintText: "Enter message"),
            ),
          ),
          new IconButton(
            icon: Icon(Icons.send),
            onPressed:
            _isComposing ? () => _handleSubmit(_controllerText.text) : null,
          ),
        ],
      ),
    );
  }

  _handleSubmit(String value) {
    _controllerText.clear();
    _addMessage(
      text: value,
      name: "John Doe",
      initials: "DJ",
    );

    _requestChatBot(value);
  }

  _requestChatBot(String text) async {
    var dialogSessionId = "projects/mediroo-542cb/agent/sessions/mediroo-542cb";

    Map data = {
      "queryInput": {
        "text": {
          "text": text,
          "languageCode": "en",
        }
      }
    };

    var request = GoogleCloudDialogflowV2DetectIntentRequest.fromJson(data);

    var resp = await _dialog.projects.agent.sessions
        .detectIntent(request, dialogSessionId);
    var result = resp.queryResult;
    _addMessage(
        name: "Roo",
        initials: "R",
        bot: true,
        text: result.fulfillmentText);
  }

  void _initChatbot() async {
    String configString = await rootBundle.loadString('config/dialogflow.json');
    String _dialogFlowConfig = configString;

    var credentials = new ServiceAccountCredentials.fromJson(_dialogFlowConfig);

    const _SCOPES = const [DialogflowApi.CloudPlatformScope];

    var httpClient = await clientViaServiceAccount(credentials, _SCOPES);
    _dialog = new DialogflowApi(httpClient);
    _requestChatBot('first_time_welcome John');
  }

  void _addMessage(
      {String name, String initials, bool bot = false, String text}) {
    var animationController = AnimationController(
      duration: new Duration(milliseconds: 700),
      vsync: this,
    );

    var message = ChatMessage(
        name: name,
        text: text,
        initials: initials,
        bot: bot,
        animationController: animationController);

    setState(() {
      _messages.insert(0, message);
    });

    animationController.forward();
  }
}

class ChatMessage {
  final String name;
  final String initials;
  final String text;
  final bool bot;

  AnimationController animationController;

  ChatMessage(
      {this.name,
        this.initials,
        this.text,
        this.bot = false,
        this.animationController});
}

class ChatMessageListItem extends StatelessWidget {
  final ChatMessage chatMessage;

  ChatMessageListItem(this.chatMessage);

  @override
  Widget build(BuildContext context) {
    
    final FirebaseMessaging _firebaseMessaging = new FirebaseMessaging();
    _firebaseMessaging.requestNotificationPermissions(
        const IosNotificationSettings(sound: true, badge: true, alert: true));
        
    _firebaseMessaging.configure(
      onMessage: (Map<String, dynamic> message) {
        print('on message $message');
      },
      onResume: (Map<String, dynamic> message) {
        print('on resume $message');
      },
      onLaunch: (Map<String, dynamic> message) {
        print('on launch $message');
      },
    );

    return SizeTransition(
      sizeFactor: CurvedAnimation(
          parent: chatMessage.animationController, curve: Curves.easeOut),
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 8.0),
        child: Row(
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.only(left: 16.0),
              child: CircleAvatar(
                child: Text(chatMessage.initials ?? "JD"),
                backgroundColor: chatMessage.bot
                    ? Theme.of(context).accentColor
                    : Theme.of(context).highlightColor,
              ),
            ),
            Flexible(
              child: Container(
                margin: EdgeInsets.only(left: 16.0),
                child: new Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(chatMessage.name ?? "Jane Doe",
                        style: Theme.of(context).textTheme.subhead),
                    Container(
                      margin: const EdgeInsets.only(top: 5.0),
                      child: Text(chatMessage.text)
                    )
                  ],
                ))
            )
          ],
        ),
      ),
    );
  }
}
