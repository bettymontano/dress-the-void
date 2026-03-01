document.addEventListener("DOMContentLoaded", () => {

    // ===============================================
    // Pluggins ======================================

    gsap.registerPlugin(Draggable, InertiaPlugin, SplitText);


    // ===============================================
    // Elementos =====================================

    // Generales
    const main = document.querySelector("main");
    const playground = document.querySelector(".playground");
    const tray = document.querySelector(".accessories");
    const cat = document.querySelector(".cat");
    const voidArea = document.querySelector(".void");
    const eyes = document.querySelector(".cat__eyes");
    const wearLayer = document.querySelector(".cat__wear");

    const accessories = gsap.utils.toArray(".accessory");
    const resetBtn = document.querySelector(".reset");

    // Loading
    const loadingWrapper = document.querySelector(".loading-wrapper");
    const loadingFill = document.querySelector(".loading__completion");
    const loadingPct = document.querySelector(".loading-pct");

    // Instrucciones
    const step1 = document.querySelector(".step-1");
    const step2 = document.querySelector(".step-2");
    const chars1 = new SplitText(step1, { type: "chars" });
    const chars2 = new SplitText(step2, { type: "chars" });



    // ===============================================
    // Estados Iniciales =============================
    let isLocked = true;
    let draggables;

    // Loading Visible
    loadingWrapper.classList.add("is-active");
    main.classList.add("is-loading");

    gsap.set(loadingFill, {
        width:"0%",
    })

    loadingPct.textContent = "0%";

    // Instrucciones 
    gsap.set([step1, step2], {
        opacity: 0,
    })

    gsap.set(chars1.chars, {
        y: 10,
        opacity: 0,
    })

    gsap.set(chars2.chars, {
        y: 10,
        opacity: 0,
    })

    // Área de Juego visualmente "desactivada"
    gsap.set(playground, {
        opacity: 0.4
    })


    // ===============================================
    // Draggable =====================================

    draggables = Draggable.create(accessories, {
        type: "x,y",
        bounds: playground,
        inertia: true,

        dragResistance: 0.08,
        edgeResistance: 0.85,
        throwResistance: 1200,
        overshootTolerance: 0.6,

        onPress() {
            if (isLocked) return; //para que no se mueva nada si se hace click mientras está saliendo el loading o las instrucciones

            const el = this.target;
            el.classList.add("active");

            //cuando está puesto el elemento sobre el gato quiero que se salga del parent del gato y regrese al del tray para poderlo volver a mover libremente
            if (el.parentElement === wearLayer) {
                // para que empiece desde su posición en ese momento
                gsap.killTweensOf(el);

                const r = el.getBoundingClientRect();
                const p = playground.getBoundingClientRect();

                el.classList.remove("is-snapped");
                tray.appendChild(el);

                gsap.set(el, {
                    x: r.left - p.left,
                    y: r.top - p.top,
                    rotation: 0,
                })

                const d = Draggable.get(el);
                if (d) d.update();
            }
        },

        onRelease() {
            this.target.classList.remove("active");
        },

        onDragEnd() {
            if (isLocked) return;

            const el = this.target;

            //al soltar un accesorio dentro del área del gato o área void, se hace el snap
            const onCat = Draggable.hitTest(el, cat, "35%");
            const onVoid = Draggable.hitTest(el, voidArea, "35%");

            if (onCat || onVoid) {
                this.endDrag(); //para cortar la inercia
                snapToCat(el); 
            } else {
                goHome(el);
            }
        }
    })

    draggables.forEach(d => d.disable()); //por mientras se carga la intro (Loading, instrucciones)


    // ===============================================
    // Loading =======================================
    function playLoading() {
        const counter = {
            value: 0
        };

        const tl = gsap.timeline({
            defaults: {
                ease: "none"
            },
            onComplete: () => {
                gsap.to(loadingWrapper, {
                    opacity: 0,
                    duration: 0.35,
                    onComplete: () => {
                        loadingWrapper.classList.remove("is-active");
                        main.classList.remove("is-loading");
                    }
                });
            }
        })

        tl.to(loadingFill, {
            width: "100%",
            duration: 2.5,
        }, 0)

        tl.to(counter, {
            value: 100,
            duration: 2.5,
            onUpdate: () => {
                loadingPct.textContent = `${Math.round(counter.value)}%`;
            }
        }, 0)

        return tl;
    }


    // ===============================================
    // Instrucciones =================================
    function playInstructions() {

        const tl = gsap.timeline({
            defaults: {
                ease: "power2.out",
            }
        })

        tl.set(step1, {
            opacity: 1,
            delay: 0.8,
        })

        tl.to(chars1.chars, {
            y: 0,
            opacity: 1,
            duration: 0.25,
            stagger: 0.08,
        })

        tl.to({}, {
            duration: 1.1, //tiempo para leer la instrucción
        })

        tl.to(chars1.chars, {
            y: -4,
            opacity: 0,
            duration: 0.18,
            stagger: 0.01,
        })

        tl.to(step1, {
            opacity: 0,
            y: -8,
            duration: 0.5,
        })

        tl.set(step2, {
            x: 70,
            y: -20
        }, 0)

        tl.set(step2, {
            opacity: 1,
            delay: 0.7,
        }, "+=0.15");

        tl.to(chars2.chars, {
            y: 0,
            opacity: 1,
            duration: 0.25,
            stagger: 0.08,
        })

        tl.to({}, {
            duration: 1.1,
        })

        tl.to(chars2.chars, {
            y: -4,
            opacity: 0,
            duration: 0.18,
            stagger: 0.01,
        })

        tl.to(step2, {
            opacity: 0,
            y: -8,
            duration: 0.5
        })

        //aquí activo visualmente el juego:
        tl.to(playground, {
            opacity: 1,
            duration: 0.4
        })

        return tl;
    }


    // ===============================================
    // Funciones del Juego ===========================
    // Snap

    //esta es la forma en la que encontré que podría hacer un "snap", similar a lo que me sugeriste. Cada accesorio lo he exportado en un artboard del mismo tamaño que el artboard del gato, de tal forma que al sobreponerlos con inset: 0 quedan perfectamente alineados donde irían sobre el gato, así que lo que hago es cambiarlos de tener el tray como parent a tener el box del gato como parent y se alinean solos.
   
    function snapToCat(el) {
        gsap.killTweensOf(el); //por alguna razón tengo un bug que está arrastrando propiedades de los elementos que no necesito entonces estoy borrándolas todas al iniciar la función

        gsap.set(el, { 
            x: 0, 
            y: 0, 
            rotation: 0, 
        });

        wearLayer.appendChild(el);
        el.classList.add("is-snapped");

        gsap.set(el, { 
            x: "50%", 
            y: "50%", //tengo un transform: translate en CSS que estoy compensando aquí al poner los 50%
            rotation: 0, 
        });

        // limpio el draggable de nuevo para cuando lo vuelva a usar:
        const d = Draggable.get(el);
        if (d) d.update();
    }


    // Home 
    function goHome(el) {
        //para que los accesorios regresen a su lugar original en el "arco"
        gsap.to(el, {
            x: 0,
            y: 0, //porque las posiciones las tengo especificadas en CSS
            duration: 0.2,
            ease: "power2.out",
        })
    }

    // Reset All (botón)
    function resetAll() {
        accessories.forEach((el) => {
            if (el.parentElement === wearLayer) {
                el.classList.remove("is-snapped");
                tray.appendChild(el);
            }

            gsap.set(el, {
                x: 0,
                y: 0,
                rotation: 0,
            })
        })
    }

    resetBtn.addEventListener("click", resetAll);


    // ===============================================
    // Parpadeo del Gato =============================
    // lo estoy haciendo de forma "falsa" usando scaleY: 0 (para que se reduzcan altura y parezca que se cierran)
    function startBlink() {
        const tl = gsap.timeline({
            repeat: -1, //quiero que se repita indefinidamente
        })

        function blinkDelay() { //la forma que encontré de que se repitiera de forma aleatoria
            return gsap.utils.random(1.8, 4.2, 0.1);
        }

        tl.to({}, {
            duration: blinkDelay()
        })
        .to(eyes, {
            scaleY: 0,
            transformOrigin: "50% 45%", //como la imagen de los ojos del gato también vive en una caja del tamaño y posición con referencia al cuerpo del gato, tuve que jugar con estas coordenadas para encontrar la altura correcta de donde se cerrarían los ojos
            duration: 0.08,
            ease: "power2.in"
        })
        .to(eyes, {
            scaleY: 1,
            duration: 0.10,
            ease: "power2.out"
        })
        .to({}, {
            duration: 0.15
        })
        .call(() => {

            // doble parpadeo
            if(Math.random() < 0.35) {
                gsap.to(eyes, {
                    scaleY: 0,
                    duration: 0.07,
                    ease: "power2.in"
                })
                gsap.to(eyes, {
                    scaleY: 1,
                    duration: 0.1,
                    ease: "power2.out",
                    delay: 0.08,
                })
            }
        })
    }


    // ===============================================
    // Intro (Secuencia General) =====================
    const master = gsap.timeline({
        onComplete: () => {
            isLocked = false;
            draggables.forEach(d => d.enable());

            startBlink();
        }
    })

    master.add( playLoading() );
    master.add( playInstructions(), "+=0.15");

})