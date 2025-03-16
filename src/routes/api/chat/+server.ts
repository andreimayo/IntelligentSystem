import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';


const OLLAMA_HOST = 'http://localhost:11434';


export const GET: RequestHandler = async () => {
  return json({
    message: "This is a chat API endpoint. Please use POST method with a JSON body containing a 'message' field."
  });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
  
    const body = await request.json();
    const chatMessage = body.message || '';

    const user = {
      name: "Andrei Mayo",
      age: 21,
      hobbies: ["basketball", "dota", "mobile legends"],
      likes: ["pizza", "fries", "burger"],
      userType: "Regular User"
    };

  
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
          model: 'deepseek-r1:1.5b',
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that provides information about a user named Andrei Mayo.
                        Here is the data about Andrei:
                        - Name: ${user.name}
                        - Age: ${user.age}
                        - Hobbies: ${user.hobbies.join(', ')}
                        - Favorite foods: ${user.likes.join(', ')}
                        
                        Only provide the specific information that was asked for. Do not provide additional information.
                        For example, if asked "What's my name?", only respond with "Your name is Andrei Mayo."
                        If asked "What's my age?", only respond with "You are 21 years old."
                        If asked about hobbies, only mention the hobbies.
                        If asked about food, only mention the favorite foods.`
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
      { error: `Failed to process request: .message}` },
      { status: 500 }
    );
  }
};


function getDirectResponse(message: string, user: any): string | null {
 
  const lowerMessage = message.toLowerCase();
  
 
  if (
    lowerMessage.includes("what's my name") || 
    lowerMessage.includes("what is my name") ||
    lowerMessage.includes("my name")
  ) {
    return `Your name is ${user.name}.`;
  }
  
  
  if (
    lowerMessage.includes("what's my age") || 
    lowerMessage.includes("what is my age") ||
    lowerMessage.includes("how old am i") ||
    lowerMessage.includes("my age")
  ) {
    return `You are ${user.age} years old.`;
  }
  
 
  if (
    lowerMessage.includes("what are my hobbies") || 
    lowerMessage.includes("what's my hobby") ||
    lowerMessage.includes("what is my hobby") ||
    lowerMessage.includes("what do i like to do") ||
    lowerMessage.includes("my hobbies")
  ) {
    return `Your hobbies are ${user.hobbies.join(', ')}.`;
  }
  
  
  if (
    lowerMessage.includes("food") || 
    lowerMessage.includes("food that i like") ||
    lowerMessage.includes("what do i like to eat") ||
    lowerMessage.includes("favorite food") ||
    lowerMessage.includes("favourite food") ||
    lowerMessage.includes("what's my favorite food") ||
    lowerMessage.includes("what is my favorite food")
  ) {
    return `Your favorite foods are ${user.likes.join(', ')}.`;
  }
  
 
  return null;
}