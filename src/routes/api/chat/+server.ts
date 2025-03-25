import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';


const OLLAMA_HOST = 'http://localhost:11434';
const OLLAMA_MODEL = 'deepseek-r1:1.5b';


const userData = {
  name: "Andrei Mayo",
  age: 21,
  hobbies: ["basketball", "dota", "mobile legends"],
  likes: ["pizza", "fries", "burger"],
  birthday: "march 24",
  birthYear: 2003,
  summary: "Andrei Mayo, 21, Basketball, Dota, Mobile Legends, Pizza, Fries, Burger",
  userType: "Regular User"
};


const PREDEFINED_JSON_RESPONSE = {
  "summary_of_context_data": `The master user is ${userData.name}, age ${userData.age}. His hobbies include ${userData.hobbies.join(', ')}. His favorite foods are ${userData.likes.join(', ')}. His birthday is on ${userData.birthday}, ${userData.birthYear}.`,
  "master_user_name": userData.name,
  "sensitive_information_present": true,
  "confidence_level": 100,
  "user_persona_description": `${userData.name} appears to be a young individual who enjoys both gaming (Dota, Mobile Legends) and physical activities (basketball). He has a taste for fast food items like pizza, fries, and burger, suggesting he might be a casual and relaxed person who enjoys convenient and popular food options.`
};


const QUESTION_PATTERNS = {
  NAME: [
    "what's my name", 
    "what is my name", 
    "my name",
    "who am i",
    "tell me my name"
  ],
  AGE: [
    "what's my age", 
    "what is my age", 
    "how old am i", 
    "my age",
    "tell me my age"
  ],
  HOBBIES: [
    "what are my hobbies", 
    "what's my hobby", 
    "what is my hobby", 
    "what do i like to do", 
    "my hobbies",
    "my hobby",
    "activities i enjoy",
    "what i do for fun"
  ],
  FOOD: [
    "food", 
    "food that i like", 
    "what do i like to eat", 
    "favorite food", 
    "favourite food", 
    "what's my favorite food", 
    "what is my favorite food",
    "what i eat",
    "what i like to eat"
  ],
  BIRTHDAY: [
    "when is my birthday", 
    "birthdate", 
    "my birthday",
    "when was i born",
    "birth date"
  ],
  ABOUT: [
    "about me", 
    "about myself", 
    "information about me",
    "tell me about myself",
    "who am i",
    "my information",
    "my profile",
    "my details"
  ],

  JSON_REQUEST: [
    "return in json format",
    "can you provide a summary or key points of the context data",
    "master user associated with you",
    "sensitive information in the context data",
    "confidence level",
    "what kind of person the user appears to be"
  ]
};

export const GET: RequestHandler = async () => {
  return json({
    message: "This is a chat API endpoint. Please use POST method with a JSON body containing a 'message' field."
  });
};


export const POST: RequestHandler = async ({ request }) => {
  try {
  
    const body = await request.json();
    const chatMessage = body.message || '';
    
    const user = userData;

    if (isJsonRequest(chatMessage)) {
      return json({ response: JSON.stringify(PREDEFINED_JSON_RESPONSE, null, 2) });
    }


    const directResponse = getDirectResponse(chatMessage, user);
    if (directResponse) {
      return json({ response: directResponse });
    }

    try {
      const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            {
              role: "system",
              content: generateSystemPrompt(user)
            },
            {
              role: "user",
              content: chatMessage
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ollama API error:", errorText);
   
        const fallbackResponse = getDirectResponse(chatMessage, user) || 
          `I'm sorry, I couldn't process your request at the moment.`;
        return json({ response: fallbackResponse });
      }

      const data = await response.json();
     
      return json({ 
        response: data.message?.content || 'No response from AI'
      });
    } catch (error) {
      console.error("Error connecting to Ollama:", error);
   
      const fallbackResponse = getDirectResponse(chatMessage, user) || 
        `I'm sorry, I couldn't connect to the AI service. Please try again later.`;
      return json({ response: fallbackResponse });
    }
  } catch (error) {
    console.error("Error processing chat request:", error);
    return json(
      { error: `Failed to process request: $` },
      { status: 500 }
    );
  }
};


function isJsonRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  

  let matchCount = 0;
  for (const pattern of QUESTION_PATTERNS.JSON_REQUEST) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      matchCount++;
    }
  }
  

  return matchCount >= 3;
}


function generateSystemPrompt(user: any): string {
  return `You are a helpful assistant that provides information about a user.
          Here is the data about the user:
          - Name: ${user.name}
          - Age: ${user.age}
          - Hobbies: ${user.hobbies.join(', ')}
          - Favorite foods: ${user.likes.join(', ')}
          - Birthday: ${user.birthday}
          
          Only provide the specific information that was asked for. Do not provide additional information.
          For example:
          - If asked "What's my name?", only respond with "Your name is ${user.name}."
          - If asked "What's my age?", only respond with "You are ${user.age} years old."
          - If asked about hobbies, only mention the hobbies.
          - If asked about food, only mention the favorite foods.
          - If asked about the user, respond with "${user.summary}"
          - If asked "When is your birthday?", only respond "Your birthday is ${user.birthday}, ${user.birthYear}."
          
          Keep responses concise and directly answer the question without adding extra information.`;
}


function getDirectResponse(message: string, user: any): string | null {

  const lowerMessage = message.toLowerCase();
  

  if (matchesAnyPattern(lowerMessage, QUESTION_PATTERNS.NAME)) {
    return `Your name is ${user.name}.`;
  }
  
  if (matchesAnyPattern(lowerMessage, QUESTION_PATTERNS.AGE)) {
    return `You are ${user.age} years old.`;
  }
  
  if (matchesAnyPattern(lowerMessage, QUESTION_PATTERNS.HOBBIES)) {
    return `Your hobbies are ${user.hobbies.join(', ')}.`;
  }
  
  if (matchesAnyPattern(lowerMessage, QUESTION_PATTERNS.FOOD)) {
    return `Your favorite foods are ${user.likes.join(', ')}.`;
  }

  if (matchesAnyPattern(lowerMessage, QUESTION_PATTERNS.BIRTHDAY)) {
    return `Your birthday is on ${user.birthday}, ${user.birthYear}.`;
  }

  if (matchesAnyPattern(lowerMessage, QUESTION_PATTERNS.ABOUT)) {
    return `${user.summary}`;
  }

  if (isGreeting(lowerMessage)) {
    return `Hello! I'm an AI assistant for ${user.name}. How can I help you today?`;
  }
  

  return null;
}


function matchesAnyPattern(message: string, patterns: string[]): boolean {
  return patterns.some(pattern => message.includes(pattern));
}


function isGreeting(message: string): boolean {
  const greetings = ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"];
  return greetings.some(greeting => message.includes(greeting));
}