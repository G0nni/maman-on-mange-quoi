import { describe, expect, it } from 'vitest'
import { REFERENTIAL } from '../data/ingredients'
import { createIndex, searchReferential } from './referential'

const labels = (q: string) => searchReferential(q, REFERENTIAL).map((e) => e.label)

describe('searchReferential', () => {
  it('ne propose rien avant 2 caractères', () => {
    expect(searchReferential('p', REFERENTIAL)).toEqual([])
    expect(searchReferential(' ', REFERENTIAL)).toEqual([])
  })

  it('trouve par début de label, sans accents ni majuscules', () => {
    expect(labels('creme')).toContain('Crème fraîche')
    expect(labels('Crè')[0]).toBe('Crème')
    expect(labels('toma')).toEqual(expect.arrayContaining(['Tomates', 'Tomates cerises', 'Tomates en conserve']))
  })

  it('trouve par alias et indique l’alias reconnu', () => {
    const [first] = searchReferential('patate', REFERENTIAL)
    expect(first).toMatchObject({ id: 'pomme-de-terre', label: 'Pommes de terre', matched: 'patate' })
  })

  it('trouve aussi un mot au milieu du label', () => {
    expect(labels('fumé')).toEqual(expect.arrayContaining(['Saumon fumé', 'Poitrine fumée']))
  })

  it('propose les groupes rangeables, pas les groupes composites', () => {
    expect(labels('pat')).toContain('Pâtes')
    expect(labels('semoule')).not.toContain('Semoule, boulgour ou quinoa')
    expect(labels('lardon')).not.toContain('Lardons ou jambon')
  })

  it('classe le début de label avant l’alias et le mot interne, et limite le nombre', () => {
    const res = labels('po')
    expect(res.length).toBeLessThanOrEqual(6)
    expect(res.every((l) => l.toLowerCase().startsWith('po'))).toBe(true)
  })
})

describe('createIndex.label', () => {
  const index = createIndex(REFERENTIAL)
  it('renvoie le libellé d’un ingrédient, d’un groupe, ou l’id à défaut', () => {
    expect(index.label('creme-fraiche')).toBe('Crème fraîche')
    expect(index.label('fromage-rape')).toBe('Fromage râpé')
    expect(index.label('inconnu')).toBe('inconnu')
  })
})
