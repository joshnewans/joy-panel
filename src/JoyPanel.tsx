import { LinearProgress, Button, styled as muiStyled } from "@mui/material";
import { PanelExtensionContext, RenderState } from "@foxglove/studio";
import { ros1 } from "@foxglove/rosmsg-msgs-common";
import { useLayoutEffect, useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
// import { RealGamepad } from "./RealGamepad"
import Gamepads from 'gamepads';


const StyledButton = muiStyled(Button, {
  shouldForwardProp: (prop) => prop !== "buttonColor",
})<{ buttonColor?: string }>(({ theme, buttonColor }) => {
  if (buttonColor == undefined) {
    return {};
  }
  const augmentedButtonColor = theme.palette.augmentColor({
    color: { main: buttonColor },
  });

  return {
    backgroundColor: augmentedButtonColor.main,
    color: augmentedButtonColor.contrastText,
    transition: "none",

    "&:hover": {
      backgroundColor: augmentedButtonColor.dark,
    },
  };
});

// type PanelState = {
//   topic?: string;
// };

function JoyPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  // const [topics, setTopics] = useState<readonly Topic[] | undefined>();
  // const [messages, setMessages] = useState<readonly MessageEvent<unknown>[] | undefined>();

  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();

  const [state, setState] = useState("Initial");
  const [buttons, setButtons] = useState<any[]>([]);
  const [axes, setAxes] = useState<any[]>([]);

  const controllers = useRef<any[]>([]);

  // const imageTopics = useMemo(
  //   () => (topics ?? []).filter((topic) => topic.datatype === "sensor_msgs/CompressedImage"),
  //   [topics],
  // );

  // const [state, setState] = useState<PanelState>(() => {
  //   return context.initialState as PanelState;
  // });

  // useEffect(() => {
  //   context.saveState({ topic: state.topic });
  //   if (state.topic) {
  //     context.subscribe([state.topic]);
  //   }
  // }, [context, state.topic]);

  // useEffect

  function connecthandler(e: any) {
    setState("Connected");
    var idx : number = e.gamepad.gamepad.index;
    controllers.current[idx] = e.gamepad;
  }

  function disconnecthandler() {
    setState("Disconnected");
  }

  useEffect(() => {
    Gamepads.start();

    setState("Driver started")

    Gamepads.addEventListener("connect", connecthandler);
    Gamepads.addEventListener("disconnect", disconnecthandler);

    return () => {
      Gamepads.stop();
    }

  }, []);



  // advertise topic
  const currentTopic = "/joy";
  // const { topic: currentTopic } = config;
  useLayoutEffect(() => {
    if (!currentTopic) {
      return;
    }

    context.advertise?.(currentTopic, "sensor_msgs/Joy", {
      datatypes: new Map([
        ["geometry_msgs/Vector3", ros1["geometry_msgs/Vector3"]],
        ["sensor_msgs/Joy", ros1["sensor_msgs/Joy"]],
      ]),
    });

    return () => {
      context.unadvertise?.(currentTopic);
    };
  }, [context, currentTopic]);


  function updateStatus() {


    if (controllers.current[0]) {
      var controller = controllers.current[0].gamepad;
      var axesVals = controller.axes.map((x: number) : number => {return -x});
      var buttonVals = controller.buttons.map((item : any) => item.pressed);

      const joyMessage = {
        header: {
          frame_id: "blah"
        },
        axes: axesVals,
        buttons: buttonVals
      };

      
      setAxes(joyMessage.axes);
      setButtons(joyMessage.buttons);

      context.publish?.(currentTopic, joyMessage);

    }
  }




  // We use a layout effect to setup render handling for our panel. We also setup some topic subscriptions.
  useLayoutEffect(() => {
    // The render handler is run by the broader studio system during playback when your panel
    // needs to render because the fields it is watching have changed. How you handle rendering depends on your framework.
    // You can only setup one render handler - usually early on in setting up your panel.
    //
    // Without a render handler your panel will never receive updates.
    //
    // The render handler could be invoked as often as 60hz during playback if fields are changing often.
    context.onRender = (_renderState: RenderState, done) => {
      // render functions receive a _done_ callback. You MUST call this callback to indicate your panel has finished rendering.
      // Your panel will not receive another render callback until _done_ is called from a prior render. If your panel is not done
      // rendering before the next render call, studio shows a notification to the user that your panel is delayed.
      //
      // Set the done callback into a state variable to trigger a re-render.
      setRenderDone(() => done);

      // incCount();

      updateStatus();

      // // We may have new topics - since we are also watching for messages in the current frame, topics may not have changed
      // // It is up to you to determine the correct action when state has not changed.
      // setTopics(renderState.topics);

      // // currentFrame has messages on subscribed topics since the last render call
      // setMessages(renderState.currentFrame);
    };

    // After adding a render handler, you must indicate which fields from RenderState will trigger updates.
    // If you do not watch any fields then your panel will never render since the panel context will assume you do not want any updates.

    // tell the panel context that we care about any update to the _topic_ field of RenderState
    context.watch("topics");

    // tell the panel context we want messages for the current frame for topics we've subscribed to
    // This corresponds to the _currentFrame_ field of render state.
    context.watch("currentFrame");

    // subscribe to some topics, you could do this within other effects, based on input fields, etc
    // Once you subscribe to topics, currentFrame will contain message events from those topics (assuming there are messages).
    context.subscribe(["/some/topic"]);
  }, [context]);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);






  // let test = ["1","2","3","4","5"];



  let cols = buttons.map((item, index) => <StyledButton key={index}
  variant="contained"
  size="large"
  buttonColor={item > 0 ? "#FF0000" : "#0000FF"}
  // buttonColor={buttonColor ? buttonColor : undefined}
  // title={canPublish ? buttonTooltip : "Connect to ROS to publish data"}
  // disabled={!canPublish || parsedObject == undefined}
  // onClick={onPublishClicked}
>
  {index}
</StyledButton>);


let ax2 = axes.map((item, index) => <LinearProgress key={index} variant="determinate" value={item*50+50} sx={{transition: "none"}}/>);


  return (
    <div style={{ padding: "1rem" }}>
      <h2>Joystick Panel</h2>
      <StyledButton key={state}
  variant="contained"
  size="large"
  // buttonColor={buttonColor ? buttonColor : undefined}
  // title={canPublish ? buttonTooltip : "Connect to ROS to publish data"}
  // disabled={!canPublish || parsedObject == undefined}
  // onClick={onPublishClicked}
>
  {state}
</StyledButton>
      {cols}
      {ax2}

    </div>
  );
}

export function initJoyPanel(context: PanelExtensionContext): void {
  ReactDOM.render(<JoyPanel context={context} />, context.panelElement);
}
