/*
  Button

  Turns on and off a light emitting diode(LED) connected to digital pin 13,
  when pressing a pushbutton attached to pin 2.

  The circuit:
  - LED attached from pin 13 to ground through 220 ohm resistor
  - pushbutton attached to pin 2 from +5V
  - 10K resistor attached to pin 2 from ground

  - Note: on most Arduinos there is already an LED on the board
    attached to pin 13.

  created 2005
  by DojoDave <http://www.0j0.org>
  modified 30 Aug 2011
  by Tom Igoe

  This example code is in the public domain.

  https://www.arduino.cc/en/Tutorial/BuiltInExamples/Button
*/

/*
Modified by Demircan Tas for How to Make (almost) Anything 2021

Pseudo PWM
*/

// constants won't change. They're used here to set pin numbers:
const int buttonPin = 2;     // the number of the pushbutton pin
const int ledPin =  5;      // the number of the LED pin

// variables will change:
int buttonState = 0;         // variable for reading the pushbutton status
int upTime = 1;        // variable for LED blink frequency

int counter = 1000;
int tick = 5;
// int downTime = counter / 500;

void setup() {
  // initialize the LED pin as an output:
  pinMode(ledPin, OUTPUT);
  // initialize the pushbutton pin as an input:
  pinMode(buttonPin, INPUT);
}

void loop() {
  
    // turn LED on: 
    digitalWrite(ledPin, HIGH);
    delay(upTime);
    digitalWrite(ledPin, LOW);
    delay(counter / 50);
    // Fade in:
    if (counter <= 0 || counter >= 1000){
      tick = -tick;
      }
    else {
      counter += tick;
      }
}
