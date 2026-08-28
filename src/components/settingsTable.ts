export type SettingsEditorType = 'sentence' | 'word' | 'count' | 'dateTime'

export interface SettingsTableColumn<T = Record<string, any>> {
  field: string & keyof T
  label: string
  editor: SettingsEditorType
  hint?: string
  rules?: Array<(v: any) => boolean | string>
  editable?: boolean
}
