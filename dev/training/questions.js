export default
{"intro":
"Your patient is connected to a ventilator, with multiple IVs and a tracheostomy. He needs trach care, Foley catheter care, dressings changed, IV medications given, and his ventilator settings adjusted. Some of these procedures are new to you. Heather is an experienced nurse on your unit.",
 "questions":[
 {"text":
"You took care of this patient yesterday with me. Today you’re on your own, because I’m very busy with my own patients.",
"options":[
{ "text":"I’m very comfortable doing the trach and foley care, and I’ve changed his_dressings several times so I feel very confident doing that on my own. But I’m not sure about the vent settings. I need some help with that.", "next":1, "score":100},
{ "text":"Sorry, I'm not supposed to be here.", "next":-1 },
{ "text": "I can see how crazy things are today. I’m very comfortable doing the trach and foley care, and I’ve changed his_dressings several times, so I feel very confident doing that on my own, but I’m still not sure about the vent settings. I’ll grab one of the other new nurses to help me since they don’t have a full patient assignment either.", "next":2}
 ]},
{
    "text":"I’m too busy. You’re just going to have to figure it out on your own.",
    "options":[{"text":"How about if I call Eric in respiratory; he said to call if I ever needed assistance. Maybe he can come up and review the vent with me.", "score":100, "next": 4},
    {"text":"You can’t just leave me on my own. You’re my preceptor. You’re supposed to help me when I need it, and I’m telling you, I need help with this patient.", "next":4}]
},
{"text":"You should be fine. You didn’t have any problems yesterday. Have more confidence in yourself. I’ll check in with you later to make sure everything is ok.", 
 "options":[
     {"text":"That would be great. Thanks for the vote of confidence.", "score":0, "next":-1}
 ]},
{"text":"I think that’s a good plan. He is an excellent resource. You may also want to ask Dr. Grayson. He usually makes rounds in the morning, and he loves teaching. I’m sure he would be happy to review the vent settings with you and answer any other questions you might have.", 
 "options":[
     {"text":"Great! Thank you for that advice.", "score":0, "next":-1}
 ]},
{"text":"You’re a nurse now, not a student. You can’t always be looking for someone to hold your hand and do things for you. I went over everything with you yesterday. If you were smart enough to pass your nursing boards, you should be smart enough to remember what I taught you yesterday.", 
 "options":[
     {"text":"OK, if that’s the way you feel.", "score":0, "next":-1}
 ]}]
}