export async function copy(text): Promise<boolean> {
   return new Promise(resolve => {
      if (navigator.clipboard) {
         navigator.clipboard.writeText(text)
            .then(() => resolve(true))
            .catch(() => resolve(false));
      } else {
         let textarea = document.createElement('textarea')
         textarea.value = text
         document.body.appendChild(textarea)
         textarea.select()
         document.execCommand('copy')
         document.body.removeChild(textarea)
         resolve(true)
      }
   })
}