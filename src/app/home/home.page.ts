
import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
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

  contador = 100;

  // Mejoras de economía
  clicsAutomaticos = 0;
  multiplicadorClics = 1;
  nivelMultiplicador = 0;

  private timerClicsAutomaticos?: ReturnType<typeof setInterval>;

  get precioAuto(): number {
    return Math.ceil(50 * Math.pow(1.8, this.clicsAutomaticos));
  }

  get precioMultiplicador(): number {
    return 500 * Math.pow(2, this.nivelMultiplicador);
  }

  // Movimiento del botón antimisiles
  antimisilX = 50;
  antimisilY = 50;

  private timerMovimientoAntimisil?: ReturnType<typeof setInterval>;

  // Armas
  armas: Arma[] = this.crearArmasIniciales();
  armaSeleccionadaId = 'misilBasico';

  get armaSeleccionada(): Arma | undefined {
    return this.armas.find(
      arma => arma.id === this.armaSeleccionadaId
    );
  }

  // Salud nacional
  salud = 100;
  saludMaxima = 100;

  // Países enemigos
  paises = [
    { name: 'República de Norvak', salud: 20 },
    { name: 'Federación de Drakonia', salud: 70 },
    { name: 'Imperio de Varkesh', salud: 120 },
    { name: 'Unión de Zorath', salud: 500 },
    { name: 'República de Kaldoria', salud: 800 },
    { name: 'Imperio de Obsidiana', salud: 1500 }
  ];

  paisActual = 0;
  saludEnemigoMaxima = this.paises[0].salud;
  saludEnemigo = this.saludEnemigoMaxima;

  get nivelCampana(): number {
    return this.paisActual + 1;
  }

  get enemigoActual() {
    return this.paises[this.paisActual] ?? null;
  }

  // Quick Time Event
  eventoDefensa = false;
  tiempoRestante = 10;
  interceptoresNecesarios = 15;
  interceptoresLanzados = 0;

  private timerDefensa?: ReturnType<typeof setInterval>;
  private fechaFinDefensa = 0;

  // Estado de partida
  partidaTerminada = false;
  victoriaFinal = false;
  mensaje = '';

  constructor(
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef
  ) {}

  // CREACIÓN DE ARMAS
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

  // ECONOMÍA
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

  // SELECCIÓN DE ARMAS
  seleccionarArma(id: string) {
    if (this.partidaTerminada || this.eventoDefensa) return;

    const arma = this.armas.find(item => item.id === id);

    if (!arma || !arma.desbloqueada) return;

    this.armaSeleccionadaId = id;
    this.mensaje = `Has seleccionado: ${arma.nombre}.`;
  }

  // LANZAMIENTO DE MISILES
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

  // CAMPAÑA
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

  // INICIO DEL QUICK TIME EVENT
  private iniciarDefensa() {
    this.detenerTemporizador();
    this.detenerMovimientoAntimisil();

    this.eventoDefensa = true;
    this.interceptoresLanzados = 0;
    this.tiempoRestante = 10;

    this.mensaje = '¡ALERTA! ¡Intercepta el contraataque!';

    this.fechaFinDefensa = Date.now() + 20000;

    this.iniciarMovimientoAntimisil();

    this.timerDefensa = setInterval(() => {
      if (!this.eventoDefensa) return;

      const restante = this.fechaFinDefensa - Date.now();

      this.tiempoRestante = Math.max(
        0,
        Math.ceil(restante / 1000)
      );

      if (restante <= 0) {
        this.finalizarDefensa(false);
        return;
      }

      this.cdr.detectChanges();
    }, 100);
  }

  // MOVIMIENTO DEL BOTÓN ANTIAÉREO
  private moverAntimisil(): void {
    this.antimisilX = Math.floor(Math.random() * 77) + 12;
    this.antimisilY = Math.floor(Math.random() * 51) + 25;
  }

  private iniciarMovimientoAntimisil(): void {
    this.detenerMovimientoAntimisil();

    const velocidad = Math.max(
      220,
      900 - (this.nivelCampana - 1) * 100
    );

    this.moverAntimisil();

    this.timerMovimientoAntimisil = setInterval(() => {
      if (!this.eventoDefensa) {
        this.detenerMovimientoAntimisil();
        return;
      }

      this.moverAntimisil();
      this.cdr.detectChanges();

    }, velocidad);
  }

  private detenerMovimientoAntimisil(): void {
    if (this.timerMovimientoAntimisil) {
      clearInterval(this.timerMovimientoAntimisil);
      this.timerMovimientoAntimisil = undefined;
    }
  }

  // BOTÓN ANTIAÉREO
  lanzarAntimisil() {
    if (!this.eventoDefensa || this.partidaTerminada) return;

    this.interceptoresLanzados++;

    if (this.interceptoresLanzados >= this.interceptoresNecesarios) {
      this.finalizarDefensa(true);
      return;
    }

    this.moverAntimisil();

    this.cdr.detectChanges();
  }

  // FINALIZACIÓN DEL QTE
  private finalizarDefensa(exito: boolean) {
    if (!this.eventoDefensa) return;

    this.eventoDefensa = false;

    this.detenerTemporizador();
    this.detenerMovimientoAntimisil();

    if (exito) {
      this.mensaje = '¡Contraataque interceptado con éxito!';
    } else {
      this.salud = Math.max(0, this.salud - 25);

      this.mensaje =
        '¡El enemigo ha impactado! Has perdido 25 puntos de salud.';

      if (this.salud <= 0) {
        this.partidaTerminada = true;
        this.victoriaFinal = false;
        this.mensaje = 'Tu país se ha quedado sin salud nacional.';
      }
    }

    this.cdr.detectChanges();
  }

  // TEMPORIZADOR DE DEFENSA
  private detenerTemporizador() {
    if (this.timerDefensa) {
      clearInterval(this.timerDefensa);
      this.timerDefensa = undefined;
    }
  }

  // TIENDA
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
      this.cdr.detectChanges();
    }
  }

  // COMPRAS
  private procesarCompra(data: any) {
    if (this.partidaTerminada || this.eventoDefensa) return;

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

    this.armas = this.armas.map(arma => ({ ...arma }));
    this.cdr.detectChanges();
  }

  // REINICIO
  reiniciarPartida() {
    this.detenerTemporizador();
    this.detenerMovimientoAntimisil();

    this.contador = 100;

    if (this.timerClicsAutomaticos) {
      clearInterval(this.timerClicsAutomaticos);
      this.timerClicsAutomaticos = undefined;
    }

    this.clicsAutomaticos = 0;
    this.multiplicadorClics = 1;
    this.nivelMultiplicador = 0;

    this.salud = this.saludMaxima;

    this.armas = this.crearArmasIniciales();
    this.armaSeleccionadaId = 'misilBasico';

    this.paisActual = 0;
    this.inicializarEnemigo();

    this.eventoDefensa = false;
    this.tiempoRestante = 10;
    this.interceptoresLanzados = 0;

    this.antimisilX = 50;
    this.antimisilY = 50;

    this.partidaTerminada = false;
    this.victoriaFinal = false;
    this.mensaje = '';

    this.cdr.detectChanges();
  }

  // DESTRUCCIÓN DEL COMPONENTE
  ngOnDestroy() {
    this.detenerTemporizador();
    this.detenerMovimientoAntimisil();

    if (this.timerClicsAutomaticos) {
      clearInterval(this.timerClicsAutomaticos);
      this.timerClicsAutomaticos = undefined;
    }
  }
}
