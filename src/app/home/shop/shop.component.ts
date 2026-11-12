
import { Component, Input } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonRow,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonRow,
    IonTitle,
    IonToolbar
  ]
})
export class ShopComponent {

  @Input() contador = 0;
  @Input() armas: any[] = [];
  @Input() catalogo: any[] = [];
  @Input() nivelCampana = 1;
  @Input() clicsAutomaticos = 0;
  @Input() precioAuto = 50;
  @Input() multiplicadorClics = 1;
  @Input() nivelMultiplicador = 0;
  @Input() precioMultiplicador = 500;

  constructor(private modalCtrl: ModalController) {}

  // Obtener los datos de catálogo de un arma.
  obtenerDatos(arma: any): any {
    return this.catalogo.find(
      item => item.id === arma.id
    );
  }

  // Calcular el precio actual de recarga.
  obtenerPrecioRecarga(arma: any): number {
    const datos = this.obtenerDatos(arma);

    if (!datos) return 0;

    return datos.reloadBasePrice +
      arma.nivelMejora * datos.reloadPriceIncrease;
  }

  // Obtener la siguiente mejora disponible.
  obtenerSiguienteMejora(arma: any): any {
    const datos = this.obtenerDatos(arma);

    if (!datos) return null;

    return datos.upgrades.find(
      (item: any) => item.level === arma.nivelMejora + 1
    ) ?? null;
  }

  // Desbloquear un arma pagando con clics.
  desbloquearArma(arma: any) {
    const datos = this.obtenerDatos(arma);

    if (!datos || arma.desbloqueada) return;
    if (this.nivelCampana < datos.unlockLevel) return;
    if (this.contador < datos.unlockPrice) return;

    this.modalCtrl.dismiss({
      action: 'unlock',
      weaponId: arma.id
    }, 'buy');
  }

  // Recargar munición pagando con clics.
  recargarArma(arma: any) {
    const datos = this.obtenerDatos(arma);

    if (!datos || !arma.desbloqueada) return;

    const precio = this.obtenerPrecioRecarga(arma);

    if (this.contador < precio) return;

    this.modalCtrl.dismiss({
      action: 'reload',
      weaponId: arma.id
    }, 'buy');
  }

  // Mejorar un arma pagando con clics.
  mejorarArma(arma: any) {
    const mejora = this.obtenerSiguienteMejora(arma);

    if (!mejora || !arma.desbloqueada) return;
    if (this.contador < mejora.price) return;

    this.modalCtrl.dismiss({
      action: 'upgrade',
      weaponId: arma.id
    }, 'buy');
  }

  comprarGenerador() {
    if (this.contador < this.precioAuto) return;

    this.modalCtrl.dismiss({
      action: 'autoClick'
    }, 'buy');
  }

  comprarMultiplicador() {
    if (this.contador < this.precioMultiplicador) return;

    this.modalCtrl.dismiss({
      action: 'doubleClicks'
    }, 'buy');
  }

  closeShop() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
