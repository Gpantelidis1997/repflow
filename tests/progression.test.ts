import { describe,it,expect } from 'vitest'
import { calculateNextTarget } from '@/lib/engine/progression'

describe('double progression',()=>{
  it('increases after all top reps',()=>{const result=calculateNextTarget([{load:50,reps:12,difficulty:'Good'},{load:50,reps:12,difficulty:'Good'},{load:50,reps:12,difficulty:'Good'}],8,12);expect(result.state).toBe('Increase');expect(result.nextLoad).toBe(55)})
  it('builds reps inside range',()=>{const result=calculateNextTarget([{load:50,reps:10,difficulty:'Good'},{load:50,reps:9,difficulty:'Good'},{load:50,reps:8,difficulty:'Good'}],8,12);expect(result.state).toBe('Build Reps')})
  it('reduces when minimum is missed',()=>{const result=calculateNextTarget([{load:50,reps:7,difficulty:'Very Hard'}],8,12);expect(result.state).toBe('Reduce')})
  it('blocks increases after pain',()=>{const result=calculateNextTarget([{load:50,reps:12,difficulty:'Pain'}],8,12);expect(result.state).toBe('Review')})
})
