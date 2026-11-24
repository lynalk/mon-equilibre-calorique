/* Base d'aliments intégrée, environ 330 aliments.
   Valeurs moyennes pour 100 g (ou 100 ml) : kcal | protéines | glucides | lipides | portions.
   Ordre de grandeur des tables Ciqual (ANSES) : valeurs indicatives, à affiner avec la table officielle.
   Portions : "libellé:grammes;libellé:grammes". */
(function () {
  var RAW = {
    "Fruits": [
      "Abricot|49|0.8|10|0.1|1 abricot:45", "Abricot sec|240|3|55|0.5|1 abricot sec:8", "Ananas|53|0.5|11.5|0.2|1 tranche:80",
      "Avocat|160|2|1.8|15|1/2 avocat:75;1 avocat:150", "Banane|90|1.1|20|0.3|1 banane:120", "Cassis|64|1.1|9|1|1 poignée:60",
      "Cerise|56|1|12|0.3|1 poignée:80", "Citron (jus)|25|0.4|2.5|0.1|1 c. à soupe:15", "Clémentine|47|0.8|10|0.2|1 clémentine:60",
      "Coing|57|0.4|13|0.1|1 coing:200", "Datte sèche|287|2.1|65|0.4|1 datte:8", "Figue fraîche|69|0.9|15|0.3|1 figue:50",
      "Figue sèche|260|3.3|56|1.3|1 figue sèche:20", "Fraise|33|0.7|6|0.3|1 barquette:250;1 bol:150", "Framboise|46|1.2|6|0.5|1 barquette:125",
      "Fruit de la passion|70|2.2|9|0.7|1 fruit:20", "Grenade|77|1.7|15|1.2|1/2 grenade:100", "Groseille|50|1|8|0.4|1 barquette:125",
      "Kaki|70|0.6|16|0.2|1 kaki:180", "Kiwi|58|1|11|0.6|1 kiwi:75", "Litchi|70|0.8|16|0.2|5 litchis:60",
      "Mandarine|47|0.8|10|0.2|1 mandarine:70", "Mangue|64|0.8|14|0.4|1/2 mangue:150", "Melon|35|0.8|7|0.2|1 tranche:150;1/2 melon:300",
      "Mûre|45|1.4|7|0.5|1 bol:125", "Myrtille|50|0.7|11|0.3|1 bol:125", "Nectarine|49|1|10|0.3|1 nectarine:150",
      "Noix de coco fraîche|360|3.5|6|34|1 morceau:40", "Orange|47|0.9|9.5|0.1|1 orange:150", "Pamplemousse|40|0.8|8|0.1|1/2 pamplemousse:150",
      "Papaye|43|0.5|9|0.3|1/2 papaye:150", "Pastèque|30|0.6|7|0.2|1 tranche:200", "Pêche|41|0.8|9|0.2|1 pêche:150",
      "Poire|55|0.4|12|0.2|1 poire:160", "Pomme|53|0.3|11.6|0.2|1 pomme:150", "Prune|50|0.7|11|0.2|1 prune:30",
      "Pruneau|240|2.4|56|0.5|1 pruneau:10", "Raisin|70|0.6|16|0.2|1 grappe:125", "Raisins secs|300|3|70|0.5|1 poignée:30",
      "Rhubarbe cuite sucrée|90|0.5|21|0.1|1 portion:100", "Compote de pommes sans sucre ajouté|60|0.3|13|0.2|1 pot:100",
      "Compote de pommes sucrée|80|0.3|19|0.2|1 pot:100", "Fruits au sirop|70|0.4|17|0.1|1 portion:120", "Salade de fruits|55|0.6|12|0.2|1 bol:150"
    ],
    "Légumes": [
      "Ail|130|6|26|0.5|1 gousse:4", "Artichaut cuit|45|2.5|7|0.2|1 fond:50", "Asperge cuite|25|2.5|2|0.3|5 asperges:100",
      "Aubergine cuite|25|1|4|0.2|1 portion:150", "Betterave cuite|45|1.7|8|0.1|1 portion:100", "Brocoli cuit|30|2.5|3|0.4|1 portion:150",
      "Carotte crue|36|0.8|7|0.3|1 carotte:80", "Carotte cuite|31|0.7|6|0.2|1 portion:150", "Carottes râpées vinaigrette|90|0.8|6|7|1 portion:100",
      "Céleri branche|15|0.7|2|0.2|1 branche:40", "Céleri-rave cuit|20|1|3|0.3|1 portion:150", "Champignons de Paris crus|22|3|0.5|0.3|1 portion:100",
      "Champignons de Paris cuits|25|2.5|1|0.5|1 portion:150", "Chou blanc cuit|25|1.3|4|0.2|1 portion:150", "Chou rouge cru|30|1.4|5|0.2|1 portion:100",
      "Chou-fleur cuit|25|2|2.5|0.3|1 portion:150", "Choux de Bruxelles cuits|40|3|4|0.5|1 portion:150", "Concombre|13|0.6|2|0.1|1/2 concombre:150",
      "Courge butternut cuite|40|1|9|0.1|1 portion:200", "Courgette cuite|18|1.2|2|0.4|1 portion:150", "Edamame cuits|120|11|8|5|1 portion:100",
      "Endive crue|15|1|2|0.1|1 endive:100", "Épinards cuits|25|3|1|0.5|1 portion:150", "Fenouil cru|20|1.2|3|0.2|1/2 fenouil:100",
      "Haricots verts cuits|30|2|4|0.2|1 portion:150", "Laitue|15|1.3|1.5|0.2|1 bol:50", "Mâche|20|2|1|0.4|1 bol:50",
      "Maïs doux en conserve|100|3|18|1.5|1 petite boîte:140;1 c. à soupe:20", "Navet cuit|18|0.8|3|0.1|1 portion:150", "Oignon cru|30|1.2|6|0.2|1 oignon:100",
      "Petits pois cuits|80|5|11|0.7|1 portion:150", "Poireau cuit|25|1.5|4|0.3|1 poireau:120", "Poivron rouge cru|30|1|5.5|0.3|1 poivron:150",
      "Poivron vert cru|22|0.9|3.5|0.2|1 poivron:150", "Potiron cuit|20|1|3.5|0.1|1 portion:200", "Radis|15|0.8|2|0.1|5 radis:50",
      "Roquette|25|2.6|2|0.7|1 bol:30", "Tomate|19|0.9|2.7|0.2|1 tomate:120", "Tomate cerise|20|0.9|3|0.2|1 poignée:80",
      "Ratatouille|60|1.2|5|4|1 portion:200", "Soupe de légumes|35|1|5|1|1 bol:250", "Gaspacho|40|1|4|2|1 verre:200",
      "Purée de légumes|50|1.5|6|2|1 portion:200", "Poêlée de légumes|60|2|7|2.5|1 portion:200"
    ],
    "Féculents et légumineuses": [
      "Riz blanc cuit|130|2.7|28|0.3|1 assiette:180;1 portion:150", "Riz complet cuit|125|2.8|25|1|1 assiette:180", "Riz cru|350|7|78|0.7|1 portion crue:60",
      "Pâtes cuites|150|5.5|30|0.9|1 assiette:200", "Pâtes complètes cuites|145|6|27|1.3|1 assiette:200", "Pâtes crues|355|12|72|1.5|1 portion crue:80",
      "Semoule cuite|115|4|23|0.3|1 portion:150", "Boulgour cuit|105|3.5|19|0.5|1 portion:150", "Quinoa cuit|120|4.4|21|1.9|1 portion:150",
      "Blé précuit cuit|140|4.5|27|1|1 portion:150", "Polenta cuite|70|1.6|15|0.3|1 portion:200", "Gnocchis cuits|130|3.5|28|0.5|1 portion:200",
      "Pomme de terre vapeur|80|2|17|0.1|1 moyenne:150", "Purée de pommes de terre|90|2|13|3.5|1 portion:200", "Frites|290|3.5|36|14|1 portion:150",
      "Frites au four|200|3|30|7|1 portion:150", "Pommes de terre sautées|150|2.5|20|6|1 portion:200", "Patate douce cuite|86|1.6|20|0.1|1 moyenne:150",
      "Lentilles cuites|116|9|17|0.5|1 portion:150", "Pois chiches cuits|140|7.5|18|2.5|1 portion:150", "Haricots rouges cuits|115|8.5|15|0.5|1 portion:150",
      "Haricots blancs cuits|110|7|16|0.6|1 portion:150", "Pois cassés cuits|120|8|18|0.5|1 portion:150", "Flocons d'avoine|370|13|59|7|1 bol:40;1 c. à soupe:10",
      "Muesli|370|9|63|6|1 bol:45", "Granola|450|9|64|16|1 bol:45", "Pétales de maïs nature|380|7|84|1|1 bol:30",
      "Céréales chocolatées|390|7|77|5|1 bol:30", "Galette de riz soufflé|390|8|81|3|1 galette:9", "Tortilla de blé|310|8.5|50|8|1 tortilla:40",
      "Couscous (graine cuite)|115|4|23|0.3|1 portion:150", "Nouilles asiatiques cuites|140|4.5|28|1|1 portion:200"
    ],
    "Boulangerie et pâtisserie": [
      "Baguette tradition|270|9|55|1.3|1/4 baguette:60;1/2 baguette:125;1 baguette:250", "Pain de campagne|250|8.5|49|1.4|1 tranche:40",
      "Pain complet|240|9.5|44|2.5|1 tranche:40", "Pain aux céréales|260|10|43|4.5|1 tranche:40", "Pain de seigle|230|7|44|1.5|1 tranche:40",
      "Pain de mie|265|8|48|4|1 tranche:25", "Pain de mie complet|250|9|42|4|1 tranche:25", "Pain burger|270|8.5|48|4.5|1 pain:60",
      "Pain au lait|340|9|52|10|1 pain au lait:35", "Brioche|360|8|50|14|1 tranche:35", "Biscotte|400|11|72|6|1 biscotte:9",
      "Croissant|420|8|45|22|1 croissant:60", "Pain au chocolat|430|7.5|47|23|1 pain au chocolat:70", "Pain aux raisins|300|6|45|11|1 pain aux raisins:100",
      "Chausson aux pommes|330|4|40|17|1 chausson:120", "Croissant aux amandes|450|9|42|27|1 croissant:100", "Chouquette|360|9|42|17|1 chouquette:10",
      "Éclair au chocolat|260|6|33|11|1 éclair:85", "Millefeuille|300|4|36|15|1 millefeuille:110", "Tarte aux pommes|240|3|33|11|1 part:120",
      "Tarte au citron meringuée|300|4|46|11|1 part:120", "Tarte aux fraises|230|3|30|11|1 part:120", "Flan pâtissier|160|4.5|25|5|1 part:130",
      "Paris-Brest|380|6|30|26|1 part:100", "Religieuse|270|5|33|13|1 religieuse:100", "Macaron|400|7|60|15|1 macaron:12",
      "Madeleine|450|6|55|23|1 madeleine:25", "Financier|420|7|45|24|1 financier:35", "Cookie|480|5.5|64|23|1 cookie:40",
      "Muffin au chocolat|420|6|50|22|1 muffin:100", "Beignet|380|6|45|20|1 beignet:70", "Brownie|450|5.5|52|25|1 part:50",
      "Pain d'épices|330|4|74|1.5|1 tranche:30", "Crêpe nature|200|6|26|8|1 crêpe:60", "Gaufre|330|7|40|16|1 gaufre:60",
      "Galette des rois frangipane|440|7|42|27|1 part:100", "Fougasse|320|9|46|11|1 fougasse:150", "Sandwich jambon-beurre|250|12|29|9|1 sandwich:250",
      "Sandwich poulet crudités|210|11|25|7|1 sandwich:250", "Sandwich thon crudités|220|11|26|8|1 sandwich:250", "Quiche lorraine|270|9|18|18|1 part:150",
      "Croque-monsieur|250|13|22|12|1 croque:150", "Pizza margherita|240|10|30|8|1 part:100;1/2 pizza:200", "Pizza jambon fromage|235|11|27|9|1 part:100;1/2 pizza:200",
      "Feuilleté au fromage|380|9|30|25|1 feuilleté:100", "Panini jambon fromage|270|13|30|10|1 panini:200"
    ],
    "Viandes et charcuterie": [
      "Blanc de poulet cuit|150|31|0|2.5|1 filet:120", "Cuisse de poulet rôtie|200|26|0|10|1 cuisse:150", "Escalope de dinde cuite|135|29|0|1.5|1 escalope:120",
      "Steak de bœuf grillé|160|28|0|5|1 steak:120", "Steak haché 5 % cuit|160|26|0|6|1 steak:100", "Steak haché 15 % cuit|230|25|0|15|1 steak:100",
      "Rôti de bœuf|170|28|0|6|1 tranche:80", "Escalope de veau cuite|140|30|0|2|1 escalope:120", "Filet mignon de porc cuit|150|28|0|4|1 portion:120",
      "Côte de porc grillée|230|27|0|13|1 côte:150", "Gigot d'agneau rôti|220|27|0|12|1 tranche:100", "Lardons cuits|300|15|0|27|1 poignée:50",
      "Jambon blanc|115|20|1|3.5|1 tranche:40", "Jambon cru|250|27|0|16|1 tranche:20", "Blanc de dinde en tranche|105|22|1|1.5|1 tranche:30",
      "Bacon|220|17|1|16|1 tranche:15", "Saucisson sec|420|25|2|35|5 rondelles:30", "Chorizo|450|23|2|39|5 tranches:30",
      "Saucisse de Toulouse cuite|300|16|1|26|1 saucisse:100", "Merguez cuite|300|15|1|26|1 merguez:60", "Saucisse de Strasbourg|270|12|1|24|1 saucisse:35",
      "Pâté de campagne|300|14|2|27|1 tranche:50", "Rillettes|450|15|0|43|1 portion:30", "Nuggets de poulet|260|15|17|15|6 nuggets:100",
      "Cordon bleu|240|13|16|13|1 cordon bleu:100", "Foie de veau cuit|160|25|4|5|1 tranche:100", "Kebab (viande seule)|250|20|2|18|1 portion:120"
    ],
    "Poissons et fruits de mer": [
      "Saumon cuit|200|23|0|12|1 pavé:125", "Saumon fumé|180|22|0|10|1 tranche:30", "Thon au naturel|110|25|0|1|1 boîte égouttée:110",
      "Thon frais cuit|130|28|0|1.5|1 steak:130", "Cabillaud cuit|90|20|0|0.7|1 filet:130", "Colin cuit|90|19|0|1|1 filet:130",
      "Truite cuite|150|22|0|7|1 filet:120", "Dorade cuite|130|21|0|5|1 filet:120", "Sardines à l'huile|210|24|0|12|1 boîte égouttée:90",
      "Maquereau à la tomate|180|14|2|13|1 boîte:120", "Crevettes cuites|100|22|0|1|1 poignée:80", "Moules cuites (sans coquille)|120|20|4|3|1 portion:100",
      "Bâtonnets de poisson panés|200|12|18|9|3 bâtonnets:90", "Surimi|105|8|15|1.5|1 bâtonnet:15", "Poisson pané|210|13|17|10|1 filet:120"
    ],
    "Œufs": [
      "Œuf|145|12.5|0.7|10|1 œuf:55;2 œufs:110", "Blanc d'œuf|48|11|0.7|0|1 blanc:33", "Omelette nature|160|11|0.5|12|Omelette 2 œufs:120",
      "Œufs brouillés|170|11|1.5|13|1 portion:120"
    ],
    "Produits laitiers et fromages": [
      "Lait entier|65|3.2|4.7|3.6|1 verre:200;1 bol:250", "Lait demi-écrémé|46|3.3|4.8|1.6|1 verre:200;1 bol:250", "Lait écrémé|34|3.4|5|0.1|1 verre:200",
      "Yaourt nature|60|4|5|3|1 pot:125", "Yaourt nature 0 %|45|4.5|6|0.1|1 pot:125", "Yaourt à la grecque|120|5|4|10|1 pot:150",
      "Yaourt aux fruits|95|3.5|14|2.5|1 pot:125", "Skyr nature|60|10.5|4|0.2|1 pot:150", "Fromage blanc 0 %|45|7.5|4|0.2|1 portion:100",
      "Fromage blanc 3 %|75|7.5|4|3.2|1 portion:100", "Petit-suisse|130|9|4|9|1 petit-suisse:60", "Crème dessert chocolat|120|3|19|3.5|1 pot:125",
      "Crème fraîche épaisse|300|2.4|3|30|1 c. à soupe:15", "Crème légère 15 %|160|3|4|15|1 c. à soupe:15", "Emmental|380|28|0|30|1 portion:30",
      "Comté|410|28|0|33|1 portion:30", "Camembert|270|20|0.5|21|1 portion:30", "Brie|330|20|0.5|28|1 portion:30",
      "Bûche de chèvre|290|19|1|23|1 rondelle:20", "Mozzarella|250|18|1|19|1 boule:125", "Feta|270|15|1|22|1 portion:30",
      "Parmesan|400|33|0|29|1 c. à soupe râpé:10", "Roquefort|370|19|0|32|1 portion:30", "Raclette|340|23|0.5|27|1 tranche:30",
      "Fromage râpé|380|27|1|30|1 poignée:30", "Fromage fondu en portion|240|10|6|20|1 portion:20", "Fromage frais ail et fines herbes|400|6|3|40|1 portion:20",
      "Ricotta|150|9|3.5|11|1 c. à soupe:30", "Boisson au soja|40|3.3|2|1.9|1 verre:200", "Boisson à l'amande|25|0.5|3|1.2|1 verre:200",
      "Boisson à l'avoine|45|0.5|7|1.5|1 verre:200", "Glace à la vanille|200|3.5|24|10|1 boule:50", "Sorbet|130|0.3|32|0.1|1 boule:50"
    ],
    "Matières grasses et sauces": [
      "Huile d'olive|900|0|0|100|1 c. à soupe:10;1 c. à café:5", "Huile de colza|900|0|0|100|1 c. à soupe:10", "Beurre|740|0.7|0.6|82|1 noisette:10;1 plaquette:250",
      "Beurre demi-sel|730|0.7|0.6|80|1 noisette:10", "Margarine allégée|360|0.2|0.5|40|1 noisette:10", "Mayonnaise|700|1|2|76|1 c. à soupe:15",
      "Vinaigrette|400|0|5|42|1 c. à soupe:15", "Ketchup|110|1.3|25|0.2|1 c. à soupe:15", "Moutarde|140|7|4|10|1 c. à café:5",
      "Sauce soja|60|8|6|0|1 c. à soupe:15", "Pesto|450|5|5|45|1 c. à soupe:15", "Sauce tomate cuisinée|60|1.5|8|2.5|1 portion:100",
      "Sauce béchamel|140|4|10|9|1 portion:100", "Sauce bolognaise|110|7|5|7|1 portion:150", "Houmous|300|7|14|24|1 c. à soupe:20",
      "Guacamole|150|1.8|6|13|1 c. à soupe:20", "Tzatziki|100|4|4|7|1 c. à soupe:20"
    ],
    "Oléagineux et graines": [
      "Amandes|600|21|8|52|1 poignée:25", "Noix|700|15|7|65|1 poignée:25", "Noisettes|650|15|7|61|1 poignée:25",
      "Noix de cajou|590|18|27|47|1 poignée:25", "Pistaches|600|20|18|50|1 poignée:25", "Cacahuètes grillées|600|25|12|50|1 poignée:25",
      "Beurre de cacahuète|610|25|15|50|1 c. à soupe:15", "Purée d'amande|630|22|7|55|1 c. à soupe:15", "Graines de chia|490|17|8|31|1 c. à soupe:12",
      "Graines de courge|570|30|10|46|1 c. à soupe:10", "Graines de lin|530|20|3|42|1 c. à soupe:10", "Mélange de fruits secs|480|12|40|30|1 poignée:30"
    ],
    "Sucré et snacks": [
      "Chocolat noir 70 %|580|8|33|42|2 carrés:20", "Chocolat au lait|540|7|56|31|2 carrés:20", "Pâte à tartiner chocolat-noisette|540|6.3|57|31|1 c. à soupe:15",
      "Confiture|250|0.4|61|0.1|1 c. à café:15", "Miel|320|0.4|80|0|1 c. à café:10", "Sucre|400|0|100|0|1 morceau:5;1 c. à café:5",
      "Biscuit sec type petit-beurre|440|7.5|75|12|1 biscuit:8", "Biscuit fourré au chocolat|470|6|70|19|1 biscuit:12", "Barre chocolatée caramel|450|4.5|65|18|1 barre:50",
      "Barre de céréales|400|6|70|10|1 barre:25", "Barre protéinée|360|30|35|10|1 barre:60", "Bonbons|350|0|85|0|1 poignée:30",
      "Chips|530|6|50|33|1 petit paquet:30", "Crackers apéritif|480|9|62|21|1 poignée:30", "Pop-corn sucré|420|4|75|12|1 cornet:50",
      "Gâteau moelleux industriel|400|5|55|18|1 gâteau:30", "Compote à boire en gourde|70|0.3|16|0.2|1 gourde:90"
    ],
    "Plats préparés": [
      "Lasagnes à la bolognaise|140|7|12|7|1 portion:300", "Hachis parmentier|120|6|10|6|1 portion:300", "Couscous royal|150|9|15|6|1 assiette:350",
      "Paella|150|8|18|5|1 assiette:350", "Gratin dauphinois|130|3|11|8|1 portion:200", "Pâtes à la carbonara|180|7|20|8|1 assiette:300",
      "Bœuf bourguignon|130|14|3|7|1 portion:250", "Blanquette de veau|120|11|5|6|1 portion:250", "Chili con carne|110|8|9|4.5|1 portion:300",
      "Burger|250|13|25|11|1 burger:200", "Kebab complet|230|12|22|11|1 kebab:350", "Sushi saumon|150|6|28|2|1 pièce:30",
      "Maki|140|4|28|1|1 maki:20", "Poke bowl saumon|150|8|18|5|1 bol:400", "Wrap au poulet|200|11|22|7|1 wrap:200",
      "Taboulé|160|3|22|6.5|1 portion:200", "Salade composée au poulet|110|9|6|5.5|1 assiette:300", "Raviolis au bœuf en conserve|90|4|13|2.5|1 portion:300",
      "Falafel|330|13|31|18|1 falafel:25", "Soupe miso|30|2|3|1|1 bol:250", "Velouté de potiron|45|1|6|2|1 bol:250"
    ],
    "Boissons": [
      "Café noir|2|0.1|0|0|1 expresso:30;1 tasse:150", "Cappuccino|40|2|4|1.5|1 tasse:200", "Thé ou infusion|1|0|0.2|0|1 tasse:250",
      "Matcha latte|50|3|6|1.5|1 tasse:250", "Chocolat chaud|80|3.5|11|2|1 tasse:250", "Jus d'orange|45|0.7|10|0.1|1 verre:200",
      "Jus de pomme|46|0.1|11|0.1|1 verre:200", "Smoothie aux fruits|55|0.6|12|0.3|1 bouteille:250", "Soda au cola|42|0|10.6|0|1 canette:330",
      "Soda zéro sucre|1|0|0|0|1 canette:330", "Limonade|40|0|10|0|1 verre:250", "Sirop à l'eau|30|0|7.5|0|1 verre:250",
      "Boisson énergisante|45|0|11|0|1 canette:250", "Thé glacé|30|0|7|0|1 bouteille:500", "Kombucha|15|0|3.5|0|1 bouteille:330",
      "Bière blonde|43|0.4|3.5|0|1 demi:250;1 bouteille:330", "Vin rouge|85|0.1|0.3|0|1 verre:125", "Vin blanc|80|0.1|1|0|1 verre:125",
      "Rosé|75|0.1|1|0|1 verre:125", "Champagne|80|0.2|1.5|0|1 coupe:100", "Cidre|40|0|4|0|1 bolée:250"
    ]
  };

  var list = [], i = 0;
  Object.keys(RAW).forEach(function (group) {
    RAW[group].forEach(function (line) {
      var a = line.split("|");
      var portions = (a[5] || "").split(";").filter(Boolean).map(function (p) {
        var k = p.lastIndexOf(":");
        return [p.slice(0, k), Number(p.slice(k + 1))];
      });
      i++;
      var slug = a[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      list.push({ id: "f-" + slug, group: group, name: a[0], kcal: +a[1], p: +a[2], c: +a[3], f: +a[4], portions: portions });
    });
  });
  window.FOODS = list;
})();
