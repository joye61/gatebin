type FormDataEntry = [string, string | File];
interface FormData {
  entries: () => Array<FormDataEntry>;
}
