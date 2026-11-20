const COMBINING_MARKS = /[̀-ͯ]/g

// "ł" has no decomposed form, so stripping combining marks leaves it alone
const foldText = (text: string) => text
  .toLowerCase()
  .normalize('NFD')
  .replace(COMBINING_MARKS, '')
  .replaceAll('ł', 'l')

export default foldText
