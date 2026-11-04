
import { Component, OnDestroy, ChangeDetectorRef  } from '@angular/core';
import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonProgressBar,
  IonRow,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular';

import { ShopComponent } from '../home/shop/shop.component';
import tiendaData from '../../assets/data/items.json';

interface Arma {
  id: string;
  nombre: string;
  descripcion: string;
  municion: number;
  dano: number;
  desbloqueada: boolean;
  nivelMejora: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonProgressBar,
    IonRow,
    IonTitle,
    IonToolbar
  ]
})
export class HomePage implements OnDestroy {

  catalogo = tiendaData.weapons;

  // Moneda del juego: todas las compras se pagan con clics.
  contador = 100;
  // Mejoras de economía
  clicsAutomaticos = 0;
  multiplicadorClics = 1;
  nivelMultiplicador = 0;

  // Precio de la siguiente mejora del generador.
  get precioAuto(): number {
    return Math.ceil(50 * Math.pow(1.8, this.clicsAutomaticos));
  }

  // Precio de la siguiente mejora del multiplicador.
  get precioMultiplicador(): number {
    return 500 * Math.pow(2, this.nivelMultiplicador);
  }

  // Temporizador de clics automáticos
  private timerClicsAutomaticos?: ReturnType<typeof setInterval>;

  armas: Arma[] = this.crearArmasIniciales();
  armaSeleccionadaId = 'misilBasico';

  get armaSeleccionada(): Arma | undefined {
    return this.armas.find(
      arma => arma.id === this.armaSeleccionadaId
    );
  }

  salud = 100;
  saludMaxima = 100;

  paises = [
    { name: 'República de Norvak', salud: 10 },
    { name: 'Federación de Drakonia', salud: 200 },
    { name: 'Imperio de Varkesh', salud: 3500 },
    { name: 'Unión de Zorath', salud: 5000 },
    { name: 'República de Kaldoria', salud: 77000 },
    { name: 'Imperio de Obsidiana', salud: 100000 }
  ];

  paisActual = 0;
  saludEnemigoMaxima = this.paises[0].salud;
  saludEnemigo = this.saludEnemigoMaxima;

  get nivelCampana(): number {
    return this.paisActual + 1;
  }

  eventoDefensa = false;
  tiempoRestante = 20;
  interceptoresNecesarios = 15;
  interceptoresLanzados = 0;

  private timerDefensa?: ReturnType<typeof setInterval>;

  partidaTerminada = false;
  victoriaFinal = false;
  mensaje = '';

  constructor(private modalCtrl: ModalController,private cdr: ChangeDetectorRef) {}

  // Crear las armas a partir del catálogo JSON.
  private crearArmasIniciales(): Arma[] {
    return this.catalogo.map(arma => ({
      id: arma.id,
      nombre: arma.name,
      descripcion: arma.description,
      municion: arma.unlockPrice === 0 ? arma.initialAmmo : 0,
      dano: arma.baseDamage,
      desbloqueada: arma.unlockPrice === 0,
      nivelMejora: 0
    }));
  }

  get enemigoActual() {
    return this.paises[this.paisActual] ?? null;
  }

  // Botón azul: cada pulsación genera un clic.
  obtenerClic() {
    if (this.partidaTerminada || this.eventoDefensa) return;

    this.contador += this.multiplicadorClics;
  }

  private iniciarClicsAutomaticos() {
    if (this.timerClicsAutomaticos) return;

    this.timerClicsAutomaticos = setInterval(() => {
      if (
        this.partidaTerminada ||
        this.eventoDefensa ||
        this.clicsAutomaticos <= 0
      ) return;

      this.contador +=
        this.clicsAutomaticos * this.multiplicadorClics;

      this.cdr.detectChanges();
    }, 2000);
  }

  seleccionarArma(id: string) {
    if (this.partidaTerminada || this.eventoDefensa) return;

    const arma = this.armas.find(item => item.id === id);

    if (!arma || !arma.desbloqueada) return;

    this.armaSeleccionadaId = id;
    this.mensaje = `Has seleccionado: ${arma.nombre}.`;
  }

  // Disparar consume munición, nunca clics.
  lanzarMisil() {
    if (
      this.partidaTerminada ||
      this.eventoDefensa ||
      !this.enemigoActual
    ) return;

    const arma = this.armaSeleccionada;

    if (!arma || !arma.desbloqueada) return;

    if (arma.municion <= 0) {
      this.mensaje = `No tienes munición para ${arma.nombre}.`;
      return;
    }

    arma.municion--;
    this.saludEnemigo -= arma.dano;

    this.mensaje = `${arma.nombre} disparado. Daño: ${arma.dano}.`;

    if (this.saludEnemigo <= 0) {
      this.derrotarEnemigo();
      return;
    }

    if (Math.random() < 0.07) {
      this.iniciarDefensa();
    }
  }

  private derrotarEnemigo() {
    const nombreDerrotado = this.enemigoActual?.name;

    this.paisActual++;

    if (this.paisActual >= this.paises.length) {
      this.partidaTerminada = true;
      this.victoriaFinal = true;
      this.mensaje = 'Has derrotado a todos los países rivales.';
      return;
    }

    this.inicializarEnemigo();

    this.mensaje =
      `${nombreDerrotado} ha sido derrotado. ¡Nuevo objetivo!`;
  }

  private inicializarEnemigo() {
    const enemigo = this.enemigoActual;

    if (!enemigo) return;

    this.saludEnemigoMaxima = enemigo.salud;
    this.saludEnemigo = enemigo.salud;
  }

  private iniciarDefensa() {
    this.detenerTemporizador();

    this.eventoDefensa = true;
    this.tiempoRestante = 20;
    this.interceptoresLanzados = 0;

    this.mensaje = '¡ALERTA! ¡Intercepta el contraataque!';

    this.timerDefensa = setInterval(() => {
      this.tiempoRestante--;

      if (this.tiempoRestante <= 0) {
        this.fallarDefensa();
      }
    }, 1000);
  }

  lanzarAntimisil() {
    if (!this.eventoDefensa || this.partidaTerminada) return;

    this.interceptoresLanzados++;

    if (this.interceptoresLanzados >= this.interceptoresNecesarios) {
      this.completarDefensa();
    }
  }

  private completarDefensa() {
    this.detenerTemporizador();

    this.eventoDefensa = false;
    this.mensaje = '¡Contraataque interceptado con éxito!';
  }

  private fallarDefensa() {
    this.detenerTemporizador();

    this.eventoDefensa = false;
    this.salud = Math.max(0, this.salud - 25);

    this.mensaje =
      '¡El enemigo ha impactado! Has perdido 25 puntos de salud.';

    if (this.salud <= 0) {
      this.partidaTerminada = true;
      this.victoriaFinal = false;
      this.mensaje = 'Tu país se ha quedado sin salud nacional.';
    }
  }

  private detenerTemporizador() {
    if (this.timerDefensa) {
      clearInterval(this.timerDefensa);
      this.timerDefensa = undefined;
    }
  }

  // Abrir tienda con el saldo actual de clics.
  async openShop() {
    if (this.partidaTerminada || this.eventoDefensa) return;

    const modal = await this.modalCtrl.create({
      component: ShopComponent,
      componentProps: {
        contador: this.contador,
        armas: this.armas,
        catalogo: this.catalogo,
        nivelCampana: this.nivelCampana,

        clicsAutomaticos: this.clicsAutomaticos,
        precioAuto: this.precioAuto,

        multiplicadorClics: this.multiplicadorClics,
        nivelMultiplicador: this.nivelMultiplicador,
        precioMultiplicador: this.precioMultiplicador
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'buy' && data) {
      this.procesarCompra(data);

      // Fuerza la actualización visual al cerrar la tienda.
      this.cdr.detectChanges();
    }
  }

  // Todas las operaciones descuentan clics de contador.
  private procesarCompra(data: any) {
    if (this.partidaTerminada || this.eventoDefensa) return;
  // Comprar generador automático.
  if (data.action === 'autoClick') {
    const precio = this.precioAuto;

    if (this.contador < precio) return;

    this.contador -= precio;
    this.clicsAutomaticos++;

    this.iniciarClicsAutomaticos();

    this.mensaje =
      `Generador comprado. Ahora produces ${this.clicsAutomaticos} clic(s) cada 2 segundos.`;

    this.cdr.detectChanges();
    return;
  }

  // Comprar multiplicador de clics.
  if (data.action === 'doubleClicks') {
    const precio = this.precioMultiplicador;

    if (this.contador < precio) return;

    this.contador -= precio;
    this.nivelMultiplicador++;
    this.multiplicadorClics *= 2;

    this.mensaje =
      `¡Multiplicador mejorado! Ahora consigues x${this.multiplicadorClics} clics.`;

    this.cdr.detectChanges();
    return;
  }

    const arma = this.armas.find(
      item => item.id === data.weaponId
    );

    const datos = this.catalogo.find(
      item => item.id === data.weaponId
    );

    if (!arma || !datos) return;

    if (data.action === 'unlock') {
      if (
        arma.desbloqueada ||
        this.nivelCampana < datos.unlockLevel ||
        this.contador < datos.unlockPrice
      ) return;

      this.contador -= datos.unlockPrice;
      arma.desbloqueada = true;
      arma.municion = datos.initialAmmo;

      this.mensaje = `Has desbloqueado ${arma.nombre}.`;
    }

    else if (data.action === 'reload') {
      const precio =
        datos.reloadBasePrice +
        arma.nivelMejora * datos.reloadPriceIncrease;

      if (!arma.desbloqueada || this.contador < precio) return;

      this.contador -= precio;
      arma.municion += datos.ammoPerPurchase;

      this.mensaje =
        `Has recargado ${arma.nombre} por ${precio} clics.`;
    }

    else if (data.action === 'upgrade') {
      const mejora = datos.upgrades.find(
        (item: any) => item.level === arma.nivelMejora + 1
      );

      if (
        !mejora ||
        !arma.desbloqueada ||
        this.contador < mejora.price
      ) return;

      this.contador -= mejora.price;

      const perdida = Math.ceil(
        arma.municion * mejora.ammoLossPercent / 100
      );

      arma.municion -= perdida;
      arma.dano = mejora.damage;
      arma.nivelMejora = mejora.level;

      this.mensaje =
        `${arma.nombre} mejorado por ${mejora.price} clics. Munición perdida: ${perdida}.`;
    }
    // Crear nuevas referencias para que Angular detecte los cambios.
    this.armas = this.armas.map(arma => ({ ...arma }));
    this.cdr.detectChanges();
  }

  reiniciarPartida() {
    this.detenerTemporizador();

    this.contador = 100;
    this.salud = this.saludMaxima;

    this.armas = this.crearArmasIniciales();
    this.armaSeleccionadaId = 'misilBasico';

    this.paisActual = 0;
    this.inicializarEnemigo();

    this.eventoDefensa = false;
    this.tiempoRestante = 20;
    this.interceptoresLanzados = 0;

    this.partidaTerminada = false;
    this.victoriaFinal = false;
    this.mensaje = '';
  }

  ngOnDestroy() {
    this.detenerTemporizador();
  }
}
