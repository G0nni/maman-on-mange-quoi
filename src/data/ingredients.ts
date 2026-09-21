/**
 * Référentiel d'ingrédients, partagé par le stock (autocomplétion, emoji) et les recettes.
 *
 * - `id` = stockId(label) : la même normalisation que les documents du stock, donc un
 *   aliment ajouté au stock retrouve son ingrédient sans table de correspondance.
 *   Vérifié par scripts/validate-recipes.ts.
 * - `aliases` : autres façons de l'écrire dans le stock (normalisées de la même façon).
 * - `protein` : famille de protéine que l'ingrédient peut apporter comme plat principal.
 *   Sert à vérifier le champ `protein` et le tag `vege` des recettes.
 * - `groups` : une recette peut demander un groupe ("fromage-rape") plutôt qu'un
 *   ingrédient précis ("comte"). Les ids de groupe partagent l'espace des ids d'ingrédients.
 */

export const CATEGORIES = [
  'proteine', 'legume', 'feculent', 'laitier', 'fruit', 'epicerie', 'condiment', 'epice', 'herbe',
] as const
export type Category = (typeof CATEGORIES)[number]

/** Épices et herbes : affichées dans la recette, jamais comptées dans « il manque ». */
export const NON_BLOCKING_CATEGORIES: readonly Category[] = ['epice', 'herbe']

export const PROTEIN_FAMILIES = [
  'volaille', 'boeuf', 'porc', 'veau', 'agneau', 'poisson', 'fruits-de-mer',
  'oeuf', 'legumineuse', 'fromage', 'vegetal',
] as const
export type ProteinFamily = (typeof PROTEIN_FAMILIES)[number]

/** Familles incompatibles avec le tag `vege`. */
export const MEAT_FISH: readonly ProteinFamily[] = ['volaille', 'boeuf', 'porc', 'veau', 'agneau', 'poisson', 'fruits-de-mer']

export type IngredientGroup = {
  id: string
  label: string
  emoji: string
  aliases?: string[]
}

export type Ingredient = {
  id: string
  label: string
  emoji: string
  category: Category
  protein?: ProteinFamily
  groups?: string[]
  aliases?: string[]
}

export const GROUPS: IngredientGroup[] = [
  { id: 'poulet', label: 'Poulet', emoji: '🍗' },
  { id: 'volaille-escalope', label: 'Blanc de poulet ou escalope de dinde', emoji: '🍗' },
  { id: 'viande-hachee', label: 'Viande hachée', emoji: '🥩' },
  { id: 'porc-cuisine', label: 'Lardons ou jambon', emoji: '🥓' },
  { id: 'saucisses', label: 'Saucisses', emoji: '🌭' },
  { id: 'poisson-blanc', label: 'Poisson blanc', emoji: '🐟', aliases: ['filet de poisson', 'poisson'] },
  { id: 'lentilles', label: 'Lentilles', emoji: '🫘' },
  { id: 'creme', label: 'Crème', emoji: '🥛' },
  { id: 'fromage-rape', label: 'Fromage râpé', emoji: '🧀', aliases: ['fromage'] },
  { id: 'pates', label: 'Pâtes', emoji: '🍝' },
  { id: 'pate-a-tarte', label: 'Pâte à tarte', emoji: '🥧' },
  { id: 'tomate-conserve', label: 'Tomates en conserve', emoji: '🥫' },
  { id: 'courge', label: 'Courge', emoji: '🎃' },
  { id: 'huile', label: 'Huile', emoji: '🫒' },
  { id: 'herbes-fraiches', label: 'Herbes fraîches', emoji: '🌿' },
  { id: 'lardons-poitrine', label: 'Lardons ou poitrine fumée', emoji: '🥓' },
  { id: 'tomates-fraiches', label: 'Tomates fraîches', emoji: '🍅' },
  { id: 'cereales', label: 'Semoule, boulgour ou quinoa', emoji: '🌾' },
  { id: 'yaourt-fromage-blanc', label: 'Yaourt ou fromage blanc', emoji: '🥛' },
  { id: 'agneau', label: 'Agneau', emoji: '🍖' },
  { id: 'porc-viande', label: 'Viande de porc (côtes, filet mignon, rôti)', emoji: '🥩' },
  { id: 'citrons', label: 'Citron jaune ou vert', emoji: '🍋' },
  { id: 'poisson-filet', label: 'Filet de poisson (saumon ou poisson blanc)', emoji: '🐟' },
]

export const INGREDIENTS: Ingredient[] = [
  // ---------- Protéines : volaille ----------
  { id: 'blanc-de-poulet', label: 'Blancs de poulet', emoji: '🍗', category: 'proteine', protein: 'volaille', groups: ['poulet', 'volaille-escalope'], aliases: ['filet de poulet', 'escalope de poulet', 'aiguillettes de poulet'] },
  { id: 'cuisse-de-poulet', label: 'Cuisses de poulet', emoji: '🍗', category: 'proteine', protein: 'volaille', groups: ['poulet'], aliases: ['hauts de cuisse', 'pilons'] },
  { id: 'poulet-entier', label: 'Poulet entier', emoji: '🐔', category: 'proteine', protein: 'volaille', groups: ['poulet'] },
  { id: 'escalope-de-dinde', label: 'Escalopes de dinde', emoji: '🦃', category: 'proteine', protein: 'volaille', groups: ['volaille-escalope'], aliases: ['dinde'] },
  { id: 'magret-de-canard', label: 'Magrets de canard', emoji: '🦆', category: 'proteine', protein: 'volaille', aliases: ['magret'] },
  { id: 'confit-de-canard', label: 'Confit de canard', emoji: '🦆', category: 'proteine', protein: 'volaille', aliases: ['cuisses de canard confites'] },
  { id: 'gesier-confit', label: 'Gésiers confits', emoji: '🦆', category: 'proteine', protein: 'volaille', aliases: ['gésiers', 'gésiers de canard'] },

  // ---------- Protéines : bœuf, veau, agneau ----------
  { id: 'boeuf-hache', label: 'Bœuf haché', emoji: '🥩', category: 'proteine', protein: 'boeuf', groups: ['viande-hachee'], aliases: ['steak haché'] },
  { id: 'boeuf-a-braiser', label: 'Bœuf à braiser', emoji: '🥩', category: 'proteine', protein: 'boeuf', aliases: ['paleron', 'gîte', 'bœuf bourguignon'] },
  { id: 'steak', label: 'Steaks', emoji: '🥩', category: 'proteine', protein: 'boeuf', aliases: ['bavette', 'entrecôte', 'rumsteck'] },
  { id: 'roti-de-boeuf', label: 'Rôti de bœuf', emoji: '🥩', category: 'proteine', protein: 'boeuf' },
  { id: 'escalope-de-veau', label: 'Escalopes de veau', emoji: '🥩', category: 'proteine', protein: 'veau' },
  { id: 'veau-a-blanquette', label: 'Veau à blanquette', emoji: '🥩', category: 'proteine', protein: 'veau', aliases: ['tendron de veau', 'épaule de veau'] },
  { id: 'paupiette-de-veau', label: 'Paupiettes de veau', emoji: '🥩', category: 'proteine', protein: 'veau', aliases: ['paupiettes'] },
  { id: 'gigot-d-agneau', label: "Gigot d'agneau", emoji: '🍖', category: 'proteine', protein: 'agneau', groups: ['agneau'] },
  { id: 'cotelette-d-agneau', label: "Côtelettes d'agneau", emoji: '🍖', category: 'proteine', protein: 'agneau', groups: ['agneau'] },

  // ---------- Protéines : porc et charcuterie ----------
  { id: 'lardon', label: 'Lardons', emoji: '🥓', category: 'proteine', protein: 'porc', groups: ['porc-cuisine', 'lardons-poitrine'], aliases: ['allumettes', 'lardons fumés'] },
  { id: 'jambon-blanc', label: 'Jambon blanc', emoji: '🍖', category: 'proteine', protein: 'porc', groups: ['porc-cuisine'], aliases: ['jambon', 'jambon de Paris'] },
  { id: 'poitrine-fumee', label: 'Poitrine fumée', emoji: '🥓', category: 'proteine', protein: 'porc', groups: ['porc-cuisine', 'lardons-poitrine'], aliases: ['bacon', 'ventrèche'] },
  { id: 'jambon-cru', label: 'Jambon cru', emoji: '🍖', category: 'proteine', protein: 'porc', aliases: ['jambon de Bayonne', 'jambon de Parme'] },
  { id: 'cote-de-porc', label: 'Côtes de porc', emoji: '🥩', category: 'proteine', protein: 'porc', groups: ['porc-viande'], aliases: ['côtelettes de porc'] },
  { id: 'filet-mignon-de-porc', label: 'Filet mignon de porc', emoji: '🥩', category: 'proteine', protein: 'porc', groups: ['porc-viande'], aliases: ['filet mignon'] },
  { id: 'roti-de-porc', label: 'Rôti de porc', emoji: '🥩', category: 'proteine', protein: 'porc', groups: ['porc-viande'] },
  { id: 'travers-de-porc', label: 'Travers de porc', emoji: '🍖', category: 'proteine', protein: 'porc', aliases: ['ribs'] },
  { id: 'chair-a-saucisse', label: 'Chair à saucisse', emoji: '🥩', category: 'proteine', protein: 'porc', groups: ['viande-hachee'] },
  { id: 'saucisse-de-toulouse', label: 'Saucisses de Toulouse', emoji: '🌭', category: 'proteine', protein: 'porc', groups: ['saucisses'] },
  { id: 'saucisse-de-strasbourg', label: 'Saucisses de Strasbourg', emoji: '🌭', category: 'proteine', protein: 'porc', groups: ['saucisses'], aliases: ['knacki', 'knack'] },
  { id: 'saucisse-de-morteau', label: 'Saucisse de Morteau', emoji: '🌭', category: 'proteine', protein: 'porc', groups: ['saucisses'] },
  { id: 'chipolata', label: 'Chipolatas', emoji: '🌭', category: 'proteine', protein: 'porc', groups: ['saucisses'] },
  { id: 'merguez', label: 'Merguez', emoji: '🌭', category: 'proteine', protein: 'boeuf', groups: ['saucisses'] },
  { id: 'chorizo', label: 'Chorizo', emoji: '🍖', category: 'proteine', protein: 'porc' },
  { id: 'boudin-noir', label: 'Boudin noir', emoji: '🌭', category: 'proteine', protein: 'porc' },

  // ---------- Protéines : poissons et fruits de mer ----------
  { id: 'pave-de-saumon', label: 'Pavés de saumon', emoji: '🐟', category: 'proteine', protein: 'poisson', groups: ['poisson-filet'], aliases: ['saumon', 'filet de saumon'] },
  { id: 'saumon-fume', label: 'Saumon fumé', emoji: '🐟', category: 'proteine', protein: 'poisson' },
  { id: 'cabillaud', label: 'Cabillaud', emoji: '🐟', category: 'proteine', protein: 'poisson', groups: ['poisson-blanc', 'poisson-filet'], aliases: ['dos de cabillaud'] },
  { id: 'colin', label: 'Colin', emoji: '🐟', category: 'proteine', protein: 'poisson', groups: ['poisson-blanc', 'poisson-filet'], aliases: ['lieu', 'merlu'] },
  { id: 'poisson-pane', label: 'Poisson pané', emoji: '🐟', category: 'proteine', protein: 'poisson', aliases: ['bâtonnets de poisson'] },
  { id: 'thon-en-boite', label: 'Thon en boîte', emoji: '🐟', category: 'proteine', protein: 'poisson', aliases: ['thon'] },
  { id: 'sardine-en-boite', label: 'Sardines en boîte', emoji: '🐟', category: 'proteine', protein: 'poisson', aliases: ['sardines'] },
  { id: 'surimi', label: 'Surimi', emoji: '🦀', category: 'proteine', protein: 'poisson' },
  { id: 'crevette', label: 'Crevettes', emoji: '🦐', category: 'proteine', protein: 'fruits-de-mer' },
  { id: 'moule', label: 'Moules', emoji: '🦪', category: 'proteine', protein: 'fruits-de-mer' },

  // ---------- Protéines : œufs et végétal ----------
  { id: 'oeuf', label: 'Œufs', emoji: '🥚', category: 'proteine', protein: 'oeuf' },
  { id: 'tofu', label: 'Tofu', emoji: '🧈', category: 'proteine', protein: 'vegetal' },

  // ---------- Légumineuses (féculents, mais protéine du plat en version végé) ----------
  { id: 'lentille-verte', label: 'Lentilles vertes', emoji: '🫘', category: 'feculent', protein: 'legumineuse', groups: ['lentilles'] },
  { id: 'lentille-corail', label: 'Lentilles corail', emoji: '🫘', category: 'feculent', protein: 'legumineuse', groups: ['lentilles'] },
  { id: 'pois-chiche', label: 'Pois chiches', emoji: '🫘', category: 'feculent', protein: 'legumineuse' },
  { id: 'haricot-rouge', label: 'Haricots rouges', emoji: '🫘', category: 'feculent', protein: 'legumineuse' },
  { id: 'haricot-blanc', label: 'Haricots blancs', emoji: '🫘', category: 'feculent', protein: 'legumineuse', aliases: ['lingots', 'mogettes', 'haricots tarbais'] },
  { id: 'pois-casse', label: 'Pois cassés', emoji: '🫛', category: 'feculent', protein: 'legumineuse' },
  { id: 'flageolet', label: 'Flageolets', emoji: '🫘', category: 'feculent', protein: 'legumineuse' },

  // ---------- Produits laitiers ----------
  { id: 'lait', label: 'Lait', emoji: '🥛', category: 'laitier' },
  { id: 'creme-fraiche', label: 'Crème fraîche', emoji: '🥛', category: 'laitier', groups: ['creme'], aliases: ['crème épaisse'] },
  { id: 'creme-liquide', label: 'Crème liquide', emoji: '🥛', category: 'laitier', groups: ['creme'], aliases: ['crème fleurette'] },
  { id: 'beurre', label: 'Beurre', emoji: '🧈', category: 'laitier' },
  { id: 'yaourt-nature', label: 'Yaourts nature', emoji: '🥛', category: 'laitier', groups: ['yaourt-fromage-blanc'], aliases: ['yaourt'] },
  { id: 'fromage-blanc', label: 'Fromage blanc', emoji: '🥛', category: 'laitier', protein: 'fromage', groups: ['yaourt-fromage-blanc'] },
  { id: 'fromage-frais', label: 'Fromage frais', emoji: '🧀', category: 'laitier', aliases: ['St Môret', 'Kiri'] },
  { id: 'emmental', label: 'Emmental', emoji: '🧀', category: 'laitier', protein: 'fromage', groups: ['fromage-rape'] },
  { id: 'gruyere', label: 'Gruyère', emoji: '🧀', category: 'laitier', protein: 'fromage', groups: ['fromage-rape'] },
  { id: 'comte', label: 'Comté', emoji: '🧀', category: 'laitier', protein: 'fromage', groups: ['fromage-rape'] },
  { id: 'parmesan', label: 'Parmesan', emoji: '🧀', category: 'laitier', protein: 'fromage', groups: ['fromage-rape'] },
  { id: 'cheddar', label: 'Cheddar', emoji: '🧀', category: 'laitier', protein: 'fromage', groups: ['fromage-rape'] },
  { id: 'mozzarella', label: 'Mozzarella', emoji: '🧀', category: 'laitier', protein: 'fromage', groups: ['fromage-rape'] },
  { id: 'chevre', label: 'Chèvre', emoji: '🧀', category: 'laitier', protein: 'fromage', aliases: ['bûche de chèvre', 'fromage de chèvre'] },
  { id: 'feta', label: 'Feta', emoji: '🧀', category: 'laitier', protein: 'fromage' },
  { id: 'reblochon', label: 'Reblochon', emoji: '🧀', category: 'laitier', protein: 'fromage' },
  { id: 'fromage-a-raclette', label: 'Fromage à raclette', emoji: '🧀', category: 'laitier', protein: 'fromage', aliases: ['raclette'] },
  { id: 'roquefort', label: 'Roquefort', emoji: '🧀', category: 'laitier', protein: 'fromage', aliases: ['bleu', "fourme d'Ambert"] },
  { id: 'camembert', label: 'Camembert', emoji: '🧀', category: 'laitier', protein: 'fromage' },

  // ---------- Féculents ----------
  { id: 'spaghetti', label: 'Spaghetti', emoji: '🍝', category: 'feculent', groups: ['pates'] },
  { id: 'penne', label: 'Penne', emoji: '🍝', category: 'feculent', groups: ['pates'] },
  { id: 'coquillette', label: 'Coquillettes', emoji: '🍝', category: 'feculent', groups: ['pates'] },
  { id: 'tagliatelle', label: 'Tagliatelles', emoji: '🍝', category: 'feculent', groups: ['pates'] },
  { id: 'fusilli', label: 'Fusilli', emoji: '🍝', category: 'feculent', groups: ['pates'], aliases: ['torsades'] },
  { id: 'macaroni', label: 'Macaronis', emoji: '🍝', category: 'feculent', groups: ['pates'] },
  { id: 'farfalle', label: 'Farfalle', emoji: '🍝', category: 'feculent', groups: ['pates'], aliases: ['papillons'] },
  { id: 'feuille-de-lasagne', label: 'Feuilles de lasagne', emoji: '🍝', category: 'feculent', aliases: ['lasagnes'] },
  { id: 'cannelloni', label: 'Cannellonis', emoji: '🍝', category: 'feculent' },
  { id: 'ravioli', label: 'Raviolis', emoji: '🥟', category: 'feculent' },
  { id: 'gnocchi', label: 'Gnocchis', emoji: '🥟', category: 'feculent' },
  { id: 'vermicelle', label: 'Vermicelles', emoji: '🍜', category: 'feculent', aliases: ['vermicelles de riz'] },
  { id: 'nouille-chinoise', label: 'Nouilles chinoises', emoji: '🍜', category: 'feculent', aliases: ['nouilles'] },
  { id: 'riz', label: 'Riz', emoji: '🍚', category: 'feculent', aliases: ['riz basmati', 'riz thaï', 'riz long'] },
  { id: 'riz-a-risotto', label: 'Riz à risotto', emoji: '🍚', category: 'feculent', aliases: ['arborio'] },
  { id: 'semoule', label: 'Semoule', emoji: '🌾', category: 'feculent', groups: ['cereales'], aliases: ['couscous', 'graine de couscous'] },
  { id: 'boulgour', label: 'Boulgour', emoji: '🌾', category: 'feculent', groups: ['cereales'] },
  { id: 'quinoa', label: 'Quinoa', emoji: '🌾', category: 'feculent', groups: ['cereales'] },
  { id: 'polenta', label: 'Polenta', emoji: '🌽', category: 'feculent' },
  { id: 'pomme-de-terre', label: 'Pommes de terre', emoji: '🥔', category: 'feculent', aliases: ['patate', 'pdt'] },
  { id: 'patate-douce', label: 'Patates douces', emoji: '🍠', category: 'feculent' },
  { id: 'pain', label: 'Pain', emoji: '🥖', category: 'feculent', aliases: ['baguette'] },
  { id: 'pain-de-mie', label: 'Pain de mie', emoji: '🍞', category: 'feculent' },
  { id: 'pain-a-burger', label: 'Pains à burger', emoji: '🍔', category: 'feculent', aliases: ['buns'] },
  { id: 'tortilla', label: 'Tortillas', emoji: '🌯', category: 'feculent', aliases: ['wraps'] },
  { id: 'galette-de-sarrasin', label: 'Galettes de sarrasin', emoji: '🥞', category: 'feculent', aliases: ['galettes bretonnes'] },
  { id: 'pate-brisee', label: 'Pâte brisée', emoji: '🥧', category: 'feculent', groups: ['pate-a-tarte'] },
  { id: 'pate-feuilletee', label: 'Pâte feuilletée', emoji: '🥐', category: 'feculent', groups: ['pate-a-tarte'] },
  { id: 'pate-a-pizza', label: 'Pâte à pizza', emoji: '🍕', category: 'feculent' },

  // ---------- Légumes ----------
  { id: 'tomate', label: 'Tomates', emoji: '🍅', category: 'legume', groups: ['tomates-fraiches'] },
  { id: 'tomate-cerise', label: 'Tomates cerises', emoji: '🍅', category: 'legume', groups: ['tomates-fraiches'] },
  { id: 'tomate-concassee', label: 'Tomates concassées', emoji: '🥫', category: 'legume', groups: ['tomate-conserve'], aliases: ['pulpe de tomate', 'tomates pelées'] },
  { id: 'coulis-de-tomate', label: 'Coulis de tomate', emoji: '🥫', category: 'legume', groups: ['tomate-conserve'], aliases: ['passata', 'sauce tomate'] },
  { id: 'courgette', label: 'Courgettes', emoji: '🥒', category: 'legume' },
  { id: 'aubergine', label: 'Aubergines', emoji: '🍆', category: 'legume' },
  { id: 'poivron', label: 'Poivrons', emoji: '🫑', category: 'legume', aliases: ['poivron rouge', 'poivron vert', 'poivron jaune'] },
  { id: 'carotte', label: 'Carottes', emoji: '🥕', category: 'legume' },
  { id: 'oignon', label: 'Oignons', emoji: '🧅', category: 'legume', aliases: ['oignon jaune'] },
  { id: 'oignon-rouge', label: 'Oignons rouges', emoji: '🧅', category: 'legume' },
  { id: 'echalote', label: 'Échalotes', emoji: '🧅', category: 'legume' },
  { id: 'ail', label: 'Ail', emoji: '🧄', category: 'legume', aliases: ["gousse d'ail"] },
  { id: 'poireau', label: 'Poireaux', emoji: '🥬', category: 'legume' },
  { id: 'champignon', label: 'Champignons', emoji: '🍄', category: 'legume', aliases: ['champignons de Paris', 'cèpes'] },
  { id: 'epinard', label: 'Épinards', emoji: '🥬', category: 'legume', aliases: ["pousses d'épinard"] },
  { id: 'haricot-vert', label: 'Haricots verts', emoji: '🫛', category: 'legume' },
  { id: 'petit-pois', label: 'Petits pois', emoji: '🫛', category: 'legume' },
  { id: 'brocoli', label: 'Brocolis', emoji: '🥦', category: 'legume' },
  { id: 'chou-fleur', label: 'Chou-fleur', emoji: '🥦', category: 'legume' },
  { id: 'chou-vert', label: 'Chou vert', emoji: '🥬', category: 'legume', aliases: ['chou', 'chou frisé'] },
  { id: 'chou-rouge', label: 'Chou rouge', emoji: '🥬', category: 'legume' },
  { id: 'chou-de-bruxelle', label: 'Choux de Bruxelles', emoji: '🥬', category: 'legume' },
  { id: 'choucroute', label: 'Choucroute', emoji: '🥬', category: 'legume' },
  { id: 'salade-verte', label: 'Salade verte', emoji: '🥬', category: 'legume', aliases: ['salade', 'laitue', 'batavia', 'mâche', 'roquette'] },
  { id: 'concombre', label: 'Concombre', emoji: '🥒', category: 'legume' },
  { id: 'avocat', label: 'Avocats', emoji: '🥑', category: 'legume' },
  { id: 'potiron', label: 'Potiron', emoji: '🎃', category: 'legume', groups: ['courge'], aliases: ['citrouille'] },
  { id: 'butternut', label: 'Butternut', emoji: '🎃', category: 'legume', groups: ['courge'] },
  { id: 'potimarron', label: 'Potimarron', emoji: '🎃', category: 'legume', groups: ['courge'] },
  { id: 'navet', label: 'Navets', emoji: '🥬', category: 'legume' },
  { id: 'panais', label: 'Panais', emoji: '🥕', category: 'legume' },
  { id: 'celeri', label: 'Céleri', emoji: '🥬', category: 'legume', aliases: ['céleri branche'] },
  { id: 'celeri-rave', label: 'Céleri-rave', emoji: '🥬', category: 'legume' },
  { id: 'fenouil', label: 'Fenouil', emoji: '🌿', category: 'legume' },
  { id: 'betterave', label: 'Betteraves', emoji: '🥗', category: 'legume' },
  { id: 'radis', label: 'Radis', emoji: '🥗', category: 'legume' },
  { id: 'asperge', label: 'Asperges', emoji: '🥬', category: 'legume' },
  { id: 'endive', label: 'Endives', emoji: '🥬', category: 'legume', aliases: ['chicons'] },
  { id: 'mais', label: 'Maïs', emoji: '🌽', category: 'legume' },
  { id: 'jardiniere-de-legume', label: 'Jardinière de légumes', emoji: '🥫', category: 'legume', aliases: ['macédoine'] },

  // ---------- Fruits ----------
  { id: 'pomme', label: 'Pommes', emoji: '🍎', category: 'fruit' },
  { id: 'poire', label: 'Poires', emoji: '🍐', category: 'fruit' },
  { id: 'banane', label: 'Bananes', emoji: '🍌', category: 'fruit' },
  { id: 'citron', label: 'Citrons', emoji: '🍋', category: 'fruit', groups: ['citrons'], aliases: ['citron jaune'] },
  { id: 'citron-vert', label: 'Citrons verts', emoji: '🍋', category: 'fruit', groups: ['citrons'] },
  { id: 'orange', label: 'Oranges', emoji: '🍊', category: 'fruit' },
  { id: 'clementine', label: 'Clémentines', emoji: '🍊', category: 'fruit', aliases: ['mandarines'] },
  { id: 'fraise', label: 'Fraises', emoji: '🍓', category: 'fruit' },
  { id: 'cerise', label: 'Cerises', emoji: '🍒', category: 'fruit' },
  { id: 'abricot', label: 'Abricots', emoji: '🍑', category: 'fruit' },
  { id: 'peche', label: 'Pêches', emoji: '🍑', category: 'fruit', aliases: ['nectarines'] },
  { id: 'melon', label: 'Melon', emoji: '🍈', category: 'fruit' },
  { id: 'pasteque', label: 'Pastèque', emoji: '🍉', category: 'fruit' },
  { id: 'raisin', label: 'Raisin', emoji: '🍇', category: 'fruit' },
  { id: 'ananas', label: 'Ananas', emoji: '🍍', category: 'fruit' },
  { id: 'kiwi', label: 'Kiwis', emoji: '🥝', category: 'fruit' },
  { id: 'mangue', label: 'Mangues', emoji: '🥭', category: 'fruit' },

  // ---------- Épicerie ----------
  { id: 'farine', label: 'Farine', emoji: '🌾', category: 'epicerie' },
  { id: 'maizena', label: 'Maïzena', emoji: '🌽', category: 'epicerie', aliases: ['fécule de maïs'] },
  { id: 'chapelure', label: 'Chapelure', emoji: '🍞', category: 'epicerie' },
  { id: 'sucre', label: 'Sucre', emoji: '🍬', category: 'epicerie', aliases: ['sucre en poudre', 'sucre roux'] },
  { id: 'sucre-vanille', label: 'Sucre vanillé', emoji: '🍬', category: 'epicerie' },
  { id: 'miel', label: 'Miel', emoji: '🍯', category: 'epicerie' },
  { id: 'levure-chimique', label: 'Levure chimique', emoji: '🧁', category: 'epicerie' },
  { id: 'chocolat-noir', label: 'Chocolat noir', emoji: '🍫', category: 'epicerie', aliases: ['chocolat pâtissier', 'chocolat'] },
  { id: 'bouillon-cube', label: 'Bouillon cube', emoji: '🥣', category: 'epicerie', aliases: ['bouillon', 'cube de bouillon', 'bouillon de volaille', 'bouillon de légumes'] },
  { id: 'fond-de-veau', label: 'Fond de veau', emoji: '🥣', category: 'epicerie' },
  { id: 'concentre-de-tomate', label: 'Concentré de tomate', emoji: '🥫', category: 'epicerie' },
  { id: 'lait-de-coco', label: 'Lait de coco', emoji: '🥥', category: 'epicerie' },
  { id: 'olive', label: 'Olives', emoji: '🫒', category: 'epicerie', aliases: ['olives noires', 'olives vertes'] },
  { id: 'cornichon', label: 'Cornichons', emoji: '🥒', category: 'epicerie' },
  { id: 'raisin-sec', label: 'Raisins secs', emoji: '🍇', category: 'epicerie' },
  { id: 'pruneau', label: 'Pruneaux', emoji: '🫐', category: 'epicerie' },
  { id: 'citron-confit', label: 'Citrons confits', emoji: '🍋', category: 'epicerie' },
  { id: 'noix', label: 'Noix', emoji: '🌰', category: 'epicerie', aliases: ['cerneaux de noix'] },
  { id: 'poudre-d-amande', label: "Poudre d'amande", emoji: '🌰', category: 'epicerie', aliases: ['amandes en poudre'] },
  { id: 'vin-blanc', label: 'Vin blanc', emoji: '🥂', category: 'epicerie' },
  { id: 'vin-rouge', label: 'Vin rouge', emoji: '🍷', category: 'epicerie' },
  { id: 'huile-d-olive', label: "Huile d'olive", emoji: '🫒', category: 'epicerie', groups: ['huile'] },
  { id: 'huile-de-tournesol', label: 'Huile de tournesol', emoji: '🌻', category: 'epicerie', groups: ['huile'], aliases: ['huile neutre', 'huile de colza'] },

  // ---------- Condiments, herbes, épices ----------
  { id: 'sel', label: 'Sel', emoji: '🧂', category: 'condiment' },
  { id: 'poivre', label: 'Poivre', emoji: '🧂', category: 'epice' },
  { id: 'vinaigre', label: 'Vinaigre', emoji: '🍶', category: 'condiment', aliases: ['vinaigre de vin', 'vinaigre balsamique'] },
  { id: 'moutarde', label: 'Moutarde', emoji: '🫙', category: 'condiment', aliases: ["moutarde à l'ancienne"] },
  { id: 'mayonnaise', label: 'Mayonnaise', emoji: '🫙', category: 'condiment', aliases: ['mayo'] },
  { id: 'ketchup', label: 'Ketchup', emoji: '🍅', category: 'condiment' },
  { id: 'pesto', label: 'Pesto', emoji: '🌿', category: 'condiment' },
  { id: 'harissa', label: 'Harissa', emoji: '🌶️', category: 'condiment' },
  { id: 'sauce-soja', label: 'Sauce soja', emoji: '🥢', category: 'condiment' },
  { id: 'gingembre', label: 'Gingembre', emoji: '🫚', category: 'epice' },
  { id: 'curry', label: 'Curry', emoji: '🍛', category: 'epice', aliases: ['curry en poudre'] },
  { id: 'paprika', label: 'Paprika', emoji: '🌶️', category: 'epice' },
  { id: 'cumin', label: 'Cumin', emoji: '🌶️', category: 'epice' },
  { id: 'muscade', label: 'Muscade', emoji: '🌰', category: 'epice', aliases: ['noix de muscade'] },
  { id: 'cannelle', label: 'Cannelle', emoji: '🌰', category: 'epice' },
  { id: 'graine-de-sesame', label: 'Graines de sésame', emoji: '🌰', category: 'epice', aliases: ['sésame'] },
  { id: 'epice-a-couscous', label: 'Épices à couscous', emoji: '🌶️', category: 'epice', aliases: ['ras el hanout'] },
  { id: 'piment-d-espelette', label: "Piment d'Espelette", emoji: '🌶️', category: 'epice' },
  { id: 'herbe-de-provence', label: 'Herbes de Provence', emoji: '🌿', category: 'herbe' },
  { id: 'thym', label: 'Thym', emoji: '🌿', category: 'herbe' },
  { id: 'laurier', label: 'Laurier', emoji: '🍃', category: 'herbe' },
  { id: 'bouquet-garni', label: 'Bouquet garni', emoji: '🌿', category: 'herbe' },
  { id: 'persil', label: 'Persil', emoji: '🌿', category: 'herbe', groups: ['herbes-fraiches'] },
  { id: 'ciboulette', label: 'Ciboulette', emoji: '🌿', category: 'herbe', groups: ['herbes-fraiches'] },
  { id: 'basilic', label: 'Basilic', emoji: '🌿', category: 'herbe', groups: ['herbes-fraiches'] },
  { id: 'coriandre', label: 'Coriandre', emoji: '🌿', category: 'herbe', groups: ['herbes-fraiches'] },
  { id: 'aneth', label: 'Aneth', emoji: '🌿', category: 'herbe', groups: ['herbes-fraiches'] },
  { id: 'menthe', label: 'Menthe', emoji: '🌿', category: 'herbe', groups: ['herbes-fraiches'] },
]

/**
 * Basiques : toujours considérés comme en stock pour les suggestions (personne ne les
 * note dans le stock, et « il manque : sel » serait inutile). Ids d'ingrédients ou de groupes.
 * PROPOSITION, à trancher : voir le récap de la phase 1.
 */
export const BASICS: string[] = [
  'sel', 'poivre', 'huile', 'vinaigre', 'moutarde',
  'beurre', 'farine', 'sucre',
  'ail', 'oignon',
  'bouillon-cube', 'thym', 'laurier', 'herbe-de-provence', 'muscade',
]

/**
 * Statut d'une ref de recette pour le calcul de « il manque » (voir CLAUDE.md) :
 * - basique : toujours considéré en stock (BASICS) ;
 * - non-bloquant : épice ou herbe, affichée mais jamais manquante ;
 * - obligatoire : doit être en stock (sauf si la recette la marque `optional`).
 * Un groupe est non bloquant si tous ses membres le sont.
 */
export type RefStatus = 'basique' | 'non-bloquant' | 'obligatoire'

const ingredientById = new Map(INGREDIENTS.map((i) => [i.id, i]))
const isNonBlocking = (i: Ingredient) => NON_BLOCKING_CATEGORIES.includes(i.category)

export function refStatus(ref: string): RefStatus {
  if (BASICS.includes(ref)) return 'basique'
  const ingredient = ingredientById.get(ref)
  if (ingredient) return isNonBlocking(ingredient) ? 'non-bloquant' : 'obligatoire'
  const members = INGREDIENTS.filter((i) => i.groups?.includes(ref))
  return members.length && members.every(isNonBlocking) ? 'non-bloquant' : 'obligatoire'
}
