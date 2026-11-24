/** Browser speech features: text to speech and speech to text (Chrome/Edge, English). */
import { toast } from '../lib/dom.js';
import { refresh, W } from '../state/store.js';
const LANG = 'en-IN';
/** Read a reply aloud when "Voice replies" is on. */
export function speak(text) {
    if (!W.speak || !window.speechSynthesis)
        return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[•\n]+/g, '. '));
    utterance.lang = LANG;
    speechSynthesis.speak(utterance);
}
/** Listen once and hand the transcript to `onTranscript`. */
export function listen(onTranscript) {
    const w = window;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
        toast('Voice input needs Chrome or Edge. You can still type.');
        return;
    }
    const recognition = new Ctor();
    recognition.lang = LANG;
    recognition.interimResults = false;
    W.listening = true;
    refresh();
    recognition.onresult = (e) => onTranscript(e.results[0][0].transcript);
    recognition.onerror = (e) => toast(`Voice input error: ${e.error}`);
    recognition.onend = () => {
        W.listening = false;
        refresh();
    };
    recognition.start();
}
