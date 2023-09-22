import { APIGatewayProxyHandler } from 'aws-lambda';
import { stat } from 'fs';

// Defines an array of allowed pizza flavors
const allowedFlavors = ['pepperoni', 'cheese', 'margherita', 'vegetarian'];

// definition of the lambda function
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('Received event:', `${event.body} --> type: ${typeof(event.body)}`); // Add this line to log the event

    // Parses the incoming event to get the flavor
    // Im using .stringify() despite 'event.body' is a string in the unit tests to ensure that event.body is treated as a string 
    // and using '{}' to handle the case where 'event.body' might be null or undefined.
    const requestBody = JSON.parse(JSON.stringify(event.body) || '{}');
    // using this console.log() to make sure the input is in correct format. 
    console.log('requestBody:', `${requestBody} --> type: ${typeof(requestBody)}`);
    // Converts to lowercase for case insensitivity for making it easier to look for specific keywords / flavors in the string
    let flavor = (requestBody || '').toLowerCase(); 
    // uses regex pattern to select only the pizza flavor from the 
    flavor = flavor.match(/"flavour":\s*"(.*?)"/)[1];
    console.log("Requested Pizza Flavor:", flavor);

    let containsPineapple = false;
    let statusCode;

    // Check if the flavor contains pineapple or hawaiian keywords
    if (flavor.includes('pineapple') || flavor.includes('hawaiian')) {
      containsPineapple = true;
      statusCode = 500; // Pineapple or Hawaiian is not allowed
    } else if (allowedFlavors.includes(flavor)) {
      // Check if the flavor is not in the list of allowed flavors
      console.log('flavor: ', flavor);
      statusCode = 200; // Flavor is among permitted values in the 'allowedFlavors' array. 
    } else {
      statusCode = 500;
    }

    // Simulate pizza creation and delivery
    const pizzaStatus = await createAndDeliverPizza(containsPineapple);

    // Prepare the response
    const response = {
      statusCode: statusCode,
      body: JSON.stringify({
        containsPineapple: containsPineapple,
        pizzaStatus: pizzaStatus,
      }),
    };
    console.log('response: ', response);

    return response;
  } catch (error: any) {
    console.error("Error:", error);
    //return handleErrors(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal Server Error",
      }),
    };
  }
};

// The functions: preparePizza, deliverPizza, and createAndDeliverPizza are used outside of the 
// lambda function to have greater modularity and reusable code making it easier to maintain and test.
// The functions preparePizza and deliverPizza are called inside the createAndDeliverPizza, so that 
// createAndDeliverPizza can later be called inside the lambda function (i.e. 'handler'). 

// Simulated function for pizza preparation time
// The async keyword indicates that this function will perform asynchronous operations, 
// and Promise<string> signifies that it will return a promise that resolves to a string.
const preparePizza = async (): Promise<string> => {
  // used to specify the duration for which the function will "simulate" pizza preparation.
  const preparationTimeMs = 10; // 0.010 seconds
  // creates a new promise. A promise is an object that represents a value which may not be 
  // available yet but will be resolved or rejected in the future. The resolve parameter is 
  // a function that will be called when the promise is resolved.
  return new Promise((resolve) => {
    // schedules a function to be executed after a specified amount of time. In this case, it's
    // used to simulate the time it takes to prepare a pizza.
    setTimeout(() => {
      // used to "resolve" the promise. When the specified preparationTimeMs (in this case, 
      // 20 milliseconds) has passed, the promise will be resolved with the specified string, indicating that the pizza is prepared.
      resolve("Pizza is prepared and ready for delivery.");
    }, preparationTimeMs);
  });
};

// Simulated function for pizza delivery time
// The async keyword indicates that this function will perform asynchronous operations, 
// and Promise<string> signifies that it will return a promise that resolves to a string.
const deliverPizza = async (): Promise<string> => {
  // used to specify the duration for which the function will "simulate" pizza delivery.
  const deliveryTimeMs = 20; // 0.02 seconds
  // creates a new promise. A promise is an object that represents a value which may not be 
  // available yet but will be resolved or rejected in the future. The resolve parameter is 
  // a function that will be called when the promise is resolved.
  return new Promise((resolve) => {
    // schedules a function to be executed after a specified amount of time. In this case, it's
    // used to simulate the time it takes to deliver a pizza.
    setTimeout(() => {
      // used to "resolve" the promise. When the specified deliveryTimeMs (in this case, 
      // 20 milliseconds) has passed, the promise will be resolved with the specified string, indicating that the pizza is delivered.
      resolve("Pizza has been delivered to your doorstep.");
    }, deliveryTimeMs);
  });
};

// Simulated function for pizza creation and delivery
async function createAndDeliverPizza(containsPineapple: boolean): Promise<string> {
  // Check if the pizza contains pineapple
  if (containsPineapple) {
    return `Sorry, we don't add pineapple to our pizzas.`;
  } else {
    // If no pineapple and value is in the flavors array, start pizza preparation and delivery
    const preparationResult = await preparePizza();
    const deliveryResult = await deliverPizza();
    return `${preparationResult} ${deliveryResult} Your pizza is on its way!`;
  }
};
