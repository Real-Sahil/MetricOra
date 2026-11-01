import { Composition } from "remotion";

import { DURATION } from "./videos/launch/cues";
import { Launch, type LaunchProps } from "./videos/launch/Launch";
import { AuditChain, type AuditChainProps } from "./videos/audit-chain/AuditChain";
import { AuditChainVertical, VERTICAL_DURATION, type AuditChainVerticalProps } from "./videos/audit-chain/AuditChainVertical";
import { DURATION as AUDIT_DURATION } from "./videos/audit-chain/cues";
import { DURATION as PLATFORM_DURATION } from "./videos/platform/cues";
import { Platform, type PlatformProps } from "./videos/platform/Platform";

export function Root() {
  return (
    <>
    <Composition
      id="Launch"
      component={Launch}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={Math.round(DURATION * 60)}
      defaultProps={{ fps: 60, debug: false } satisfies LaunchProps}
      calculateMetadata={({ props }) => ({ fps: props.fps, durationInFrames: Math.round(DURATION * props.fps) })}
    />
    <Composition
      id="Platform"
      component={Platform}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={Math.round(PLATFORM_DURATION * 60)}
      defaultProps={{ fps: 60, debug: false } satisfies PlatformProps}
      calculateMetadata={({ props }) => ({ fps: props.fps, durationInFrames: Math.round(PLATFORM_DURATION * props.fps) })}
    />
    <Composition
      id="AuditChain"
      component={AuditChain}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={Math.round(AUDIT_DURATION * 60)}
      defaultProps={{ fps: 60, debug: false } satisfies AuditChainProps}
      calculateMetadata={({ props }) => ({ fps: props.fps, durationInFrames: Math.round(AUDIT_DURATION * props.fps) })}
    />
    <Composition
      id="AuditChainVertical"
      component={AuditChainVertical}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={Math.round(VERTICAL_DURATION * 60)}
      defaultProps={{ fps: 60 } satisfies AuditChainVerticalProps}
      calculateMetadata={({ props }) => ({ fps: props.fps, durationInFrames: Math.round(VERTICAL_DURATION * props.fps) })}
    />
    </>
  );
}
