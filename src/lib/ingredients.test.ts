import { describe, expect, it } from 'vitest'
import { guessEmoji, norm, stockId } from './ingredients'

describe('norm', () => {
  it('ramène le pluriel au singulier', () => {
    expect(norm('Tomates')).toBe('tomate')
    expect(norm('tomate')).toBe('tomate')
    expect(norm('Poireaux')).toBe('poireau')
  })

  it('gère la ligature œ et les accents', () => {
    expect(norm('Œufs')).toBe('oeuf')
    expect(norm('oeuf')).toBe('oeuf')
    expect(norm('Crème fraîche')).toBe('creme fraiche')
  })

  it('traite chaque mot d’un nom composé', () => {
    expect(norm('Pommes de terre')).toBe('pomme de terre')
    expect(norm('  Tomates   cerises ')).toBe('tomate cerise')
    expect(norm('Choux-fleurs')).toBe('chou fleur')
  })

  it('laisse intacts les mots invariables', () => {
    expect(norm('Noix')).toBe('noix')
    expect(norm('Maïs')).toBe('mais')
    expect(norm('Ananas')).toBe('ananas')
    expect(norm('Petits pois')).toBe('petit pois')
    expect(norm('Radis')).toBe('radis')
    expect(norm('Coulis de tomate')).toBe('coulis de tomate')
  })

  it('ne touche pas aux mots sans marque de pluriel', () => {
    expect(norm('Riz')).toBe('riz')
    expect(norm('Lait')).toBe('lait')
  })
})

describe('stockId', () => {
  it('donne le même id pour les variantes d’un même aliment', () => {
    expect(stockId('Tomates')).toBe(stockId('tomate'))
    expect(stockId('Œufs')).toBe(stockId('oeuf'))
  })

  it('remplace les espaces par des tirets', () => {
    expect(stockId('Pommes de terre')).toBe('pomme-de-terre')
    expect(stockId("Pâte d'amande")).toBe('pate-d-amande')
  })

  it('ne produit que des caractères sûrs pour un id Firestore', () => {
    expect(stockId('Riz / basmati.')).toBe('riz-basmati')
    expect(stockId('!!!')).toBe('')
  })
})

describe('guessEmoji', () => {
  it('trouve l’emoji d’un aliment connu', () => {
    expect(guessEmoji('Tomates')).toBe('🍅')
    expect(guessEmoji('Fromage râpé')).toBe('🧀')
  })

  it('préfère la clé la plus longue', () => {
    expect(guessEmoji('Pommes de terre')).toBe('🥔')
    expect(guessEmoji('Pommes')).toBe('🍎')
  })

  it('ne matche que des mots entiers', () => {
    expect(guessEmoji('Cailles')).toBe('🥫')
  })

  it('retombe sur une conserve par défaut', () => {
    expect(guessEmoji('Quinoa')).toBe('🥫')
  })
})
