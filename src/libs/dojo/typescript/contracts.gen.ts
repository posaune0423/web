import type { DojoProvider } from "@dojoengine/core";
import type { Account } from "starknet";
import type * as models from "./models.gen";

export const client = (provider: DojoProvider) => {
  const paint_actions_init = async (account: Account) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "paint_actions",
          entrypoint: "init",
          calldata: [],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const paint_actions_onPreUpdate = async (
    account: Account,
    pixelUpdate: models.PixelUpdate,
    appCaller: models.App,
    playerCaller: string,
  ) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "paint_actions",
          entrypoint: "on_pre_update",
          calldata: [pixelUpdate, appCaller, playerCaller],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const paint_actions_onPostUpdate = async (
    account: Account,
    pixelUpdate: models.PixelUpdate,
    appCaller: models.App,
    playerCaller: string,
  ) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "paint_actions",
          entrypoint: "on_post_update",
          calldata: [pixelUpdate, appCaller, playerCaller],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const paint_actions_interact = async (account: Account, defaultParams: models.DefaultParameters) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "paint_actions",
          entrypoint: "interact",
          calldata: [defaultParams],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const paint_actions_putColor = async (account: Account, defaultParams: models.DefaultParameters) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "paint_actions",
          entrypoint: "put_color",
          calldata: [defaultParams],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const paint_actions_fade = async (account: Account, defaultParams: models.DefaultParameters) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "paint_actions",
          entrypoint: "fade",
          calldata: [defaultParams],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const paint_actions_pixelRow = async (
    account: Account,
    defaultParams: models.DefaultParameters,
    imageData: Array<number>,
  ) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "paint_actions",
          entrypoint: "pixel_row",
          calldata: [defaultParams, imageData],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_init = async (account: Account) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "init",
          calldata: [],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_canUpdatePixel = async (
    account: Account,
    forPlayer: string,
    forSystem: string,
    pixel: models.Pixel,
    pixelUpdate: models.PixelUpdate,
    areaIdHint: number,
    allowModify: boolean,
  ) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "can_update_pixel",
          calldata: [forPlayer, forSystem, pixel, pixelUpdate, areaIdHint, allowModify],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_updatePixel = async (
    account: Account,
    forPlayer: string,
    forSystem: string,
    pixelUpdate: models.PixelUpdate,
    areaId: number,
    allowModify: boolean,
  ) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "update_pixel",
          calldata: [forPlayer, forSystem, pixelUpdate, areaId, allowModify],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_processQueue = async (
    account: Account,
    id: number,
    timestamp: number,
    calledSystem: string,
    selector: number,
    calldata: Array<number>,
  ) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "process_queue",
          calldata: [id, timestamp, calledSystem, selector, calldata],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_scheduleQueue = async (
    account: Account,
    timestamp: number,
    calledSystem: string,
    selector: number,
    calldata: Array<number>,
  ) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "schedule_queue",
          calldata: [timestamp, calledSystem, selector, calldata],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_newApp = async (account: Account, system: string, name: number, icon: number) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "new_app",
          calldata: [system, name, icon],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_alertPlayer = async (account: Account, position: models.Position, player: string, message: number) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "alert_player",
          calldata: [position, player, message],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_addArea = async (
    account: Account,
    bounds: models.Bounds,
    owner: string,
    color: number,
    app: string,
  ) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "add_area",
          calldata: [bounds, owner, color, app],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_removeArea = async (account: Account, areaId: number) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "remove_area",
          calldata: [areaId],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_findAreaByPosition = async (account: Account, position: models.Position) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "find_area_by_position",
          calldata: [position],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const actions_findAreasInsideBounds = async (account: Account, bounds: models.Bounds) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "actions",
          entrypoint: "find_areas_inside_bounds",
          calldata: [bounds],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const snake_actions_init = async (account: Account) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "snake_actions",
          entrypoint: "init",
          calldata: [],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const snake_actions_interact = async (
    account: Account,
    defaultParams: models.DefaultParameters,
    direction: models.Direction,
  ) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "snake_actions",
          entrypoint: "interact",
          calldata: [defaultParams, direction],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  const snake_actions_move = async (account: Account, owner: string) => {
    try {
      return await provider.execute(
        account,
        {
          contractName: "snake_actions",
          entrypoint: "move",
          calldata: [owner],
        },
        "pixelaw",
      );
    } catch (error) {
      console.error(error);
    }
  };

  return {
    paint_actions: {
      init: paint_actions_init,
      onPreUpdate: paint_actions_onPreUpdate,
      onPostUpdate: paint_actions_onPostUpdate,
      interact: paint_actions_interact,
      putColor: paint_actions_putColor,
      fade: paint_actions_fade,
      pixelRow: paint_actions_pixelRow,
    },
    actions: {
      init: actions_init,
      canUpdatePixel: actions_canUpdatePixel,
      updatePixel: actions_updatePixel,
      processQueue: actions_processQueue,
      scheduleQueue: actions_scheduleQueue,
      newApp: actions_newApp,
      alertPlayer: actions_alertPlayer,
      addArea: actions_addArea,
      removeArea: actions_removeArea,
      findAreaByPosition: actions_findAreaByPosition,
      findAreasInsideBounds: actions_findAreasInsideBounds,
    },
    snake_actions: {
      init: snake_actions_init,
      interact: snake_actions_interact,
      move: snake_actions_move,
    },
  };
};
