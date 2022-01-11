/*
  Demircan Tas
  Four phototransistors and four vibromotors
*/

int led = 10;           // the PWM pin the LED is attached to
int brightness = 0;    // how bright the LED is

int sFR, sFL, sRR, sRL;
int vFR = 6, vFL = 7, vRR = 8, vRL = 9; // vibromotors are 6 ,7, 8, 9 (motor vcc connected to PA1)
int vX = 0, vZ = 0;

void setup() {
  // declare pin 9 to be an output:
  pinMode(led, OUTPUT);
  Serial.begin(115200); // 115200 for 1614
}

// the loop routine runs over and over again forever:
void loop() {
  // read input from analog pin 3
  sFR = analogRead(0); sFL = analogRead(1);//sensors are 0, 1, 2, 3 counter clockwise from top right (FTDI side is bottom)
  sRR = analogRead(3); sRL = analogRead(2);

  vX = (sFL + sRL) - (sFR + sRR);
  vZ = (sFL + sFR) - (sRL + sRR);

  // set brightness based on detected light
  brightness = (sFR + sFL + sRR + sRL) / 12; // divided by 4 (average) and 3 (adjustment)
  
  analogWrite(led, brightness);

  if (vX > -100 && vX < 100)
    { // go straight
        analogWrite(vFL, brightness);       // tightCW
        analogWrite(vFR, 0);       // tightCCW
        analogWrite(vRL, brightness);       // is RR now :[ broad CCW
        analogWrite(vRR, 0);       // is RL now :[ CW      
    }
  else if (vX >= 100)
    { // turn right
        analogWrite(vFL, brightness);       // tightCW
        analogWrite(vFR, 0);       // tightCCW
        analogWrite(vRL, 0);       // is RR now :[ broad CCW
        analogWrite(vRR, 0);       // is RL now :[ CW    
    }
  else if (vX <= -100)
    { // turn left
        analogWrite(vFL, 0);       // tightCW
        analogWrite(vFR, brightness);       // tightCCW
        analogWrite(vRL, 0);       // is RR now :[ broad CCW
        analogWrite(vRR, 0);       // is RL now :[ CW    
    }
  else
    {
        analogWrite(vFL, 0);       // tightCW
        analogWrite(vFR, 0);       // tightCCW
        analogWrite(vRL, 0);       // is RR now :[ broad CCW
        analogWrite(vRR, 0);       // is RL now :[ CW    
    }

  //delay(1000);
}
