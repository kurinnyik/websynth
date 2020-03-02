const container = document.getElementsByClassName('container')[0];
const buttons = Array.from(document.getElementsByClassName('button'));
const noteCountText = document.getElementById('notecount');
const delayRange = document.getElementById('delay');

const audioContext = new (window.AudioContext || window.webkitAudioContext);
const oscList = [];
let masterGainNode = null;
masterGainNode = audioContext.createGain();
masterGainNode.connect(audioContext.destination);
masterGainNode.gain.value = 0.2;
const keys =
  ["z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m",
    "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u",
    "i", "9", "o", "0", "p", "-", "[", "=", "]"
  ];
let osc = null;
let oscs = {};
const waveTypes = ['sine', 'square', 'sawtooth', 'triangle'];
let waveType = 'sine';
let isDelayOn = true;
let delayNode = audioContext.createDelay(5);

const effectsNode = [{node: delayNode, on: isDelayOn}];

function DelayToggle(e) {
  if (e.keyCode === 13) {
    isDelayOn = !isDelayOn;
    console.log(isDelayOn);
    if (isDelayOn) {
      effectsNode[0].on = true;
      //effectsNode[0].delayTime = parseFloat(delayRange.value/1000);

    } else {
      effectsNode[0].false = true;
    }
  }
};


document.addEventListener('keypress', (e) => {
  DelayToggle(e)
});


function changeWavetype(type) {
  waveType = type;
}

navigator.requestMIDIAccess()
  .then(onMIDISuccess, () => console.log('Could not access your MIDI devices.'));

function onMIDISuccess(midiAccess) {
  for (let input of midiAccess.inputs.values())
    input.onmidimessage = getMIDIMessage;

}


const notesPlayed = {};

function getMIDIMessage(midiMessage) {
  const command = midiMessage.data[0];
  const note = midiMessage.data[1];
  const velocity = (midiMessage.data.length > 2) ? midiMessage.data[2] : 0; // a velocity value might not be included with a noteOff command
  const noteShift = -49;
  switch (command) {
    case 144: // noteOn
      if (velocity > 0) {
        notesPlayed[note] = true;
        noteOn(note + noteShift, velocity);
      } else {
        noteOff(note + noteShift);
      }
      break;
    case 128: // noteOff
      noteOff(note + noteShift);
      break;
  }
}


const createScale = (octaveMultiplier, intervals, tunedTo = 220) => {
  let scale = [];
  if (typeof intervals === 'number') {
    for (let i = 0; i <= 88; i++) {
      let freq = ((octaveMultiplier) ** ((i) / intervals)) * tunedTo;
      scale.push(freq)
    }
  }
  return scale;
};

const bpScale = createScale(3, 13);
const eq12Scale = createScale(2, 12);
let Scale = bpScale;
noteOn = (note, velocity) => {
  if (osc) {
    osc.stop();
    osc = null;
  }
  if (oscs[note]) {
    return
  }
  let newOsc = audioContext.createOscillator();
  newOsc.type = waveType;
  oscs[note] = newOsc;
  newOsc.connect(masterGainNode);
  let tempNode = newOsc ;
  effectsNode.forEach((data) => {
    if (data.on) {
      tempNode.connect(data.node);
      tempNode = data.node;
    }
  });
  console.log(effectsNode);
  tempNode.connect(masterGainNode);
  let delayVal = parseFloat(delayRange.value/1000);
  effectsNode[0].node.delayTime.setValueAtTime(delayVal, audioContext.currentTime);
  console.log(audioContext.currentTime, audioContext.currentTime+delayVal);
  effectsNode[0].node.delayTime.setValueAtTime(delayVal, audioContext.currentTime+delayVal);

  //let value = 10*(note-48);
  let noteIndex = note;
  let value = noteIndex < Scale.length ? Scale[noteIndex] : 0;
  console.log(value);
  noteCountText.innerHTML = `${note}/${value}`;

  newOsc.frequency.value = parseFloat(value);
  masterGainNode.gain.value = velocity / 150;
  newOsc.start(0);
};
noteOff = (note) => {
  if (oscs[note]) {
    oscs[note].stop();
    delete oscs[note];
  }
  // masterGainNode.gain.value = 0;
};

function playFreq(i) {
  return function () {
    console.log('start');
    console.log(oscList[i]);

    oscList[i] = audioContext.createOscillator();
    oscList[i].connect(masterGainNode);
    oscList[i].frequency.value = parseFloat(220 + 10 * i);
    oscList[i].start(0);

  }
};

function stopOsc(i) {

  return function () {
    console.log('stop');

    oscList[i].stop(0);
  }
};

buttons.forEach(function (b, i) {
  b.addEventListener('mousedown', playFreq(i));
  b.addEventListener("mouseup", stopOsc(i));
});

document.addEventListener('keypress', (event) => {
  const keyIndex = keys.indexOf(event.key);
  if (keyIndex >= 0) noteOn(keyIndex, 100);
});
document.addEventListener('keyup', (event) => {
  const keyName = event.key;
  noteOff(keys.indexOf(keyName));
});