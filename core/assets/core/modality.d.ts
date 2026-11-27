/** The attribute Prismata sets on the document element: `pointer` or `keyboard`. */
export declare const ATTRIBUTE: 'data-prismata-modality';
/** Record the input modality on `doc`'s document element. Returns a function that stops. */
export declare function watch(doc?: Document): () => void;
/** What a key press says about the modality, or null if it says nothing. */
export declare function modalityForKey(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'target'>): 'keyboard' | null;
/** Whether an element takes typed text, where navigation keys move the caret. */
export declare function isTextEntry(target: EventTarget | null): boolean;

declare const modality: {
  ATTRIBUTE: typeof ATTRIBUTE;
  watch: typeof watch;
  modalityForKey: typeof modalityForKey;
  isTextEntry: typeof isTextEntry;
};
export default modality;
