/**
 * Este script es responsable
 * de las funciones que
 * serán ejecutadas
 * en el Lite Bot.
 *
 * Aquí es donde usted
 * va a definir
 * lo que su bot
 * va a hacer.
 *
 * @autor Dev Gui
 */
const path = require("node:path");
const { menu } = require("./utils/menu");
const { ASSETS_DIR, BOT_NUMBER, SPIDER_API_TOKEN } = require("./config");
const { errorLog } = require("./utils/terminal");
const {
  attp,
  ttp,
  gpt4,
  playAudio,
  playVideo,
} = require("./services/spider-x-api");
const { consultarCep } = require("correios-brasil/dist");
const { image } = require("./services/hercai");

const {
  InvalidParameterError,
  WarningError,
  DangerError,
} = require("./errors");

const {
  checkPrefix,
  deleteTempFile,
  download,
  formatCommand,
  getBuffer,
  getContent,
  getJSON,
  getProfileImageData,
  getRandomName,
  getRandomNumber,
  isLink,
  loadLiteFunctions,
  onlyLettersAndNumbers,
  onlyNumbers,
  removeAccentsAndSpecialCharacters,
  splitByCharacters,
  toUserJid,
} = require("./utils/functions");

const {
  activateAntiLinkGroup,
  deactivateAntiLinkGroup,
  isActiveAntiLinkGroup,
  activateWelcomeGroup,
  isActiveGroup,
  deactivateWelcomeGroup,
  activateGroup,
  deactivateGroup,
} = require("./database/db");

async function runLite({ socket, data }) {
  const functions = loadLiteFunctions({ socket, data });

  if (!functions) {
    return;
  }

  const {
    args,
    body,
    command,
    from,
    fullArgs,
    info,
    isImage,
    isReply,
    isSticker,
    isVideo,
    lite,
    prefix,
    replyJid,
    userJid,
    audioFromURL,
    ban,
    downloadImage,
    downloadSticker,
    downloadVideo,
    errorReact,
    errorReply,
    imageFromFile,
    imageFromURL,
    isAdmin,
    isOwner,
    react,
    recordState,
    reply,
    sendText,
    stickerFromFile,
    stickerFromInfo,
    stickerFromURL,
    successReact,
    successReply,
    typingState,
    videoFromURL,
    waitReact,
    waitReply,
    warningReact,
    warningReply,
  } = functions;

  if (!isActiveGroup(from) && !(await isOwner(userJid))) {
    return;
  }

  if (!checkPrefix(prefix)) {
    /**
     * ⏩ Un auto respondedor simple ⏪
     *
     * Si el mensaje incluye la palabra
     * (ignora mayúsculas y minúsculas) use:
     * body.toLowerCase().includes("palabra")
     *
     * Si el mensaje es exactamente igual a la
     * palabra (ignora mayúsculas y minúsculas) use:
     * body.toLowerCase() === "palabra"
     */
    if (body.toLowerCase().includes("gado")) {
      await reply("¡Usted es el gadão guerrero!");
      return;
    }

    if (body === "salve") {
      await reply("¡Salve, salve!");
      return;
    }

    // ⬇ Coloque más respuestas del auto-respondedor abajo ⬇

    // ⬆ Coloque más respuestas del auto-respondedor arriba ⬆
  }

  /**
   * 🚫 Anti-enlace 🔗
   */
  if (
    !checkPrefix(prefix) &&
    isActiveAntiLinkGroup(from) &&
    isLink(body) &&
    !(await isAdmin(userJid))
  ) {
    await ban(from, userJid);
    await reply("¡Anti-enlace activado! ¡Fue eliminado por enviar un enlace!");

    return;
  }

  /**
   * Si no hay un
   * prefijo, no haga nada.
   */
  if (!checkPrefix(prefix)) {
    return;
  }

  try {
    /**
     * Aquí va a definir
     * las funciones que
     * su bot va a ejecutar vía "cases".
     *
     * ⚠ ATENCIÓN ⚠: No traiga funciones
     * o "cases" de
     * otros bots para acá
     * sin saber lo que está haciendo.
     *
     * Cada bot tiene sus
     * particularidades y,
     * por eso, es importante
     * tener cuidado.
     * No nos responsabilizamos
     * por problemas
     * que puedan ocurrir al
     * traer códigos de otros
     * bots para acá,
     * en el intento de adaptación.
     *
     * Toda ayuda será *COBRADA*
     * caso su intención
     * sea adaptar los códigos
     * de otro bot para este.
     *
     * ✅ CASES ✅
     */
    switch (removeAccentsAndSpecialCharacters(command?.toLowerCase())) {
      case "antilink":
        if (!args.length) {
          throw new InvalidParameterError(
            "¡Necesita digitar 1 o 0 (encender o apagar)!"
          );
        }

        const antiLinkOn = args[0] === "1";
        const antiLinkOff = args[0] === "0";

        if (!antiLinkOn && !antiLinkOff) {
          throw new InvalidParameterError(
            "¡Necesita digitar 1 o 0 (encender o apagar)!"
          );
        }

        if (antiLinkOn) {
          activateAntiLinkGroup(from);
        } else {
          deactivateAntiLinkGroup(from);
        }

        await successReact();

        const antiLinkContext = antiLinkOn ? "activado" : "desactivado";

        await reply(`¡Recurso de anti-enlace ${antiLinkContext} con éxito!`);
        break;
      case "attp":
        if (!args.length) {
          throw new InvalidParameterError(
            "Necesita informar el texto que desea transformar en sticker."
          );
        }

        await waitReact();

        const attpUrl = await attp(fullArgs.trim());

        await successReact();

        await stickerFromURL(attpUrl);
        break;
      case "ban":
      case "banir":
      case "kick":
        if (!(await isAdmin(userJid))) {
          throw new DangerError(
            "¡No tiene permiso para ejecutar este comando!"
          );
        }

        if (!args.length && !isReply) {
          throw new InvalidParameterError(
            "¡Necesita mencionar o etiquetar a un miembro!"
          );
        }

        const memberToRemoveJid = isReply ? replyJid : toUserJid(args[0]);
        const memberToRemoveNumber = onlyNumbers(memberToRemoveJid);

        if (
          memberToRemoveNumber.length < 7 ||
          memberToRemoveNumber.length > 15
        ) {
          throw new InvalidParameterError("¡Número inválido!");
        }

        if (memberToRemoveJid === userJid) {
          throw new DangerError("¡No puede eliminarse a sí mismo!");
        }

        const botJid = toUserJid(BOT_NUMBER);

        if (memberToRemoveJid === botJid) {
          throw new DangerError("¡No puede eliminarme!");
        }

        await ban(from, memberToRemoveJid);

        await successReact();

        await reply("¡Miembro eliminado con éxito!");
        break;
      case "cep":
        const cep = args[0];

        if (!cep || ![8, 9].includes(cep.length)) {
          throw new InvalidParameterError(
            "¡Necesita enviar un CEP en el formato 00000-000 o 00000000!"
          );
        }

        const data = await consultarCep(cep);

        if (!data.cep) {
          await warningReply("¡CEP no encontrado!");
          return;
        }

        await successReply(`*Resultado*

*CEP*: ${data.cep}
*Calle*: ${data.logradouro}
*Complemento*: ${data.complemento}
*Barrio*: ${data.bairro}
*Localidad*: ${data.localidade}
*Estado*: ${data.uf}
*IBGE*: ${data.ibge}`);
        break;
      case "gpt4":
      case "gpt":
      case "ia":
      case "lite":
        const text = args[0];

        if (!text) {
          throw new InvalidParameterError(
            "¡Necesita decirme qué debo responder!"
          );
        }

        await waitReact();

        const responseText = await gpt4(text);

        await successReply(responseText);
        break;
      case "hidetag":
      case "tagall":
      case "marcar":
        const { participants } = await lite.groupMetadata(from);

        const mentions = participants.map(({ id }) => id);

        await react("📢");

        await sendText(`📢 ¡Etiquetando a todos!\n\n${fullArgs}`, mentions);
        break;
      case "menu":
        await successReact();
        await imageFromFile(
          path.join(ASSETS_DIR, "images", "menu.png"),
          `\n\n${menu()}`
        );
        break;
      case "off":
        if (!(await isOwner(userJid))) {
          throw new DangerError(
            "¡No tiene permiso para ejecutar este comando!"
          );
        }

        deactivateGroup(from);

        await successReply("¡Bot desactivado en el grupo!");
        break;
      case "image":
        if (!fullArgs.length) {
          throw new WarningError(
            "Por favor, proporcione una descripción para generar la imagen."
          );
        }

        await waitReact();

        const response = await image(fullArgs);

        await successReact();

        await imageFromURL(response.url);
        break;
      case "on":
        if (!(await isOwner(userJid))) {
          throw new DangerError(
            "¡No tiene permiso para ejecutar este comando!"
          );
        }

        activateGroup(from);

        await successReply("¡Bot activado en el grupo!");
        break;
      case "ping":
        await react("🏓");
        await reply("🏓 ¡Pong!");
        break;
      case "playaudio":
      case "playyt":
      case "play":
        if (!args.length) {
          throw new InvalidParameterError(
            "¡Necesita decirme qué desea buscar!"
          );
        }

        await waitReact();

        const playAudioData = await playAudio(fullArgs);

        if (!playAudioData) {
          await errorReply("¡Ningún resultado encontrado!");
          return;
        }

        await successReact();

        await audioFromURL(playAudioData.url);

        break;
      case "playvideo":
        if (!args.length) {
          throw new InvalidParameterError(
            "¡Necesita decirme qué desea buscar!"
          );
        }

        await waitReact();

        const playVideoData = await playVideo(args[0]);

        if (!playVideoData) {
          await errorReply("¡Ningún resultado encontrado!");
          return;
        }

        await successReact();

        await videoFromURL(playVideoData.url);

        break;
      case "sticker":
      case "f":
      case "fig":
      case "figu":
      case "s":
        if (!isImage && !isVideo) {
          throw new InvalidParameterError(
            "Necesita etiquetar una imagen/gif/vídeo o responder a una imagen/gif/vídeo"
          );
        }

        await waitReact();
        await stickerFromInfo(info);
        break;
      case "welcome":
      case "bemvindo":
      case "boasvinda":
      case "boasvindas":
      case "boavinda":
      case "boavindas":
        if (!args.length) {
          throw new InvalidParameterError(
            "¡Necesita digitar 1 o 0 (encender o apagar)!"
          );
        }

        const welcome = args[0] === "1";
        const notWelcome = args[0] === "0";

        if (!welcome && !notWelcome) {
          throw new InvalidParameterError(
            "¡Necesita digitar 1 o 0 (encender o apagar)!"
          );
        }

        if (welcome) {
          activateWelcomeGroup(from);
        } else {
          deactivateWelcomeGroup(from);
        }

        await successReact();

        const welcomeContext = welcome ? "activado" : "desactivado";

        await reply(`¡Recurso de bienvenida ${welcomeContext} con éxito!`);
        break;
      case "ttp":
        if (!args.length) {
          throw new InvalidParameterError(
            "Necesita informar el texto que desea transformar en sticker."
          );
        }

        await waitReact();

        const ttpUrl = await ttp(fullArgs.trim());

        await successReact();

        await stickerFromURL(ttpUrl);
        break;
    }
    // ❌ No coloque nada abajo ❌
  } catch (error) {
    /**
     * ❌ No coloque nada abajo ❌
     * Este bloque es responsable de tratar
     * los errores que ocurran durante la ejecución
     * de los "cases".
     */
    if (error instanceof InvalidParameterError) {
      await warningReply(`¡Parámetros inválidos! ${error.message}`);
    } else if (error instanceof WarningError) {
      await warningReply(error.message);
    } else if (error instanceof DangerError) {
      await errorReply(error.message);
    } else {
      errorLog(`¡Error al ejecutar comando!\n\nDetalles: ${error.message}`);

      await errorReply(
        `¡Ocurrió un error al ejecutar el comando ${command.name}!

📄 *Detalles*: ${error.message}`
      );
    }
    // ❌ No coloque nada abajo ❌
  }
}

module.exports = { runLite };
