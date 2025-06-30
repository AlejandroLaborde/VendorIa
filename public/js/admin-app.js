(function(){
  var Component = ng.core.Component;
  var NgModule = ng.core.NgModule;
  var BrowserModule = ng.platformBrowser.BrowserModule;
  var platformBrowserDynamic = ng.platformBrowserDynamic.platformBrowserDynamic;
  var FormsModule = ng.forms.FormsModule;
  var NgZone = ng.core.NgZone;

  var AppComponent = Component({
    selector: 'app-root',
    template: `
      <div class="container mt-4">
        <h1>Administraci\u00f3n</h1>
        <form (submit)="save($event)" class="mb-4">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="rag"
              [checked]="config.RAG.enabled"
              (change)="config.RAG.enabled = $event.target.checked">
            <label class="form-check-label" for="rag">RAG habilitado</label>
          </div>
          <div class="mb-3">
            <label for="otherParam" class="form-label">Otro Par\u00e1metro</label>
            <input type="text" id="otherParam" class="form-control"
              [(ngModel)]="config.otherParam" name="otherParam">
          </div>
          <button class="btn btn-primary" type="submit">Guardar</button>
        </form>
        <h2>M\u00e9tricas</h2>
        <pre>{{ metrics | json }}</pre>
      </div>
    `
  })
  .Class({
    constructor: [NgZone, function(zone){
      var self = this;
      this.zone = zone;
      this.config = { RAG: { enabled: false }, otherParam: '' };
      this.metrics = { messages: 0, history: [] };

      fetch('/admin/config')
        .then(function(r){ return r.json(); })
        .then(function(d){ self.config = d; });

      fetch('/metrics/history')
        .then(function(r){ return r.json(); })
        .then(function(d){ self.metrics = d; });

      var es = new EventSource('/metrics/stream');
      es.onmessage = function(ev){
        zone.run(function(){
          self.metrics = JSON.parse(ev.data);
        });
      };
    }],
    save: function(ev){
      ev.preventDefault();
      fetch('/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rag: this.config.RAG.enabled,
          otherParam: this.config.otherParam
        })
      }).then(function(){ alert('Guardado'); });
    }
  });

  var AppModule = NgModule({
    imports: [BrowserModule, FormsModule],
    declarations: [AppComponent],
    bootstrap: [AppComponent]
  })
  .Class({ constructor: function(){} });

  platformBrowserDynamic().bootstrapModule(AppModule);
})();
