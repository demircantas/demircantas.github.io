#include <SoftwareSerial.h>

SoftwareSerial mySerial(0, 1); // RX, TX
int led = 2;           // the PWM pin the LED is attached to
int A;
String message;
void setup() {
  Serial.begin(115200);
  mySerial.begin(115200);
  pinMode(led, OUTPUT);
  /*
  pinMode(9, INPUT);
  pinMode(10, OUTPUT);
  */
  mySerial.println("Hello, Kim?");
}

void loop() {
  
  if (mySerial.available()){
    message = mySerial.readString();    
    Serial.println(message);
  }
  if (Serial.available()){
    mySerial.write(Serial.read());
  }

  /*
  A = mySerial.parseInt();
  if(A > 0){
    for (int i=0; i < A; i++){
      digitalWrite(led, LOW);
      delay(50);
      digitalWrite(led, HIGH);
      delay(50);
      }
    }
    */
  digitalWrite(led, HIGH);
  /*
A = mySerial.parseInt();
  if (mySerial.available()){
    Serial.write(mySerial.read());
  }
  if (Serial.available()){
    mySerial.write(Serial.read());
  }
  if ( A > 500){
    digitalWrite(led, LOW);
    }
  else{
    digitalWrite(led, HIGH);
    }
  delay(500);
  */
}
