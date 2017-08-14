# guideme
todo
- *fatto* addStep: accettare stringhe e oggetti "step"
- *fatto* addStep: accettare uno o più HTMLElement, un selettore o un oggetto jQuery => usare from()
- *fatto* nuova opzione "destroyOnDone": chiama automaticamente destory al termine
- *fatto* ordine pulsanti: done, prev, next
- gestione eventi:
    -  nuovi metodi on e off
    -  eventi: start, step, end, destroy
- *fatto* usare webpack per la creazione del dist

bug
- *fatto* Safari: l'ordine degli step manuali non viene rispettato
- posizionamento anomalo di [x-arrow]:
	- aggiungere uno step (a) con target un elmento con elevata lunghezza
	- aggiungere uno step (b) senza target
	- start e arrivati allo step (b), tornare indietro
	- lo step (a) ha [x-arrow] con posizionamento anomalo