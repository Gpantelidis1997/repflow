import { describe, expect, it } from 'vitest'
import { toCsv } from '@/lib/operations/export'
describe('toCsv',()=>{it('escapes quotes and commas',()=>{expect(toCsv([{name:'A, B',note:'say "hi"'}])).toContain('"say ""hi"""')})})
