import React, { useState } from "react";
import { useComputedColorScheme } from "@mantine/core";
import type { NodeProps } from "reaflow";
import { Node } from "reaflow";
import { useModal } from "../../../../../store/useModal";
import type { NodeData } from "../../../../../types/graph";
import useGraph from "../stores/useGraph";
import useJson from "../../../../../store/useJson"; // Correct store for managing JSON
import { ObjectNode } from "./ObjectNode";
import { TextNode } from "./TextNode";

export interface CustomNodeProps {
  node: NodeData;
  x: number;
  y: number;
  hasCollapse?: boolean;
}

const CustomNodeWrapper = (nodeProps: NodeProps<NodeData>) => {
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const setVisible = useModal(state => state.setVisible);
  const colorScheme = useComputedColorScheme();

  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(nodeProps.properties.text[0].key || "");

  const { getJson, setJson } = useJson(); // Access the JSON and update function from the store

  const handleNodeClick = React.useCallback(
    (_: React.MouseEvent<SVGGElement, MouseEvent>, data: NodeData) => {
      if (setSelectedNode) setSelectedNode(data);
      setVisible("NodeModal", true);
    },
    [setSelectedNode, setVisible]
  );

  const handleSaveLocalChange = () => {
    try {
      // Parse the current JSON from the store
      const json = getJson();
      const parsedJson = JSON.parse(json);

      // Find the node in the JSON using the node's path or ID
      const nodePath = (nodeProps.properties as any).path as string | undefined;

      if (!nodePath) {
        setIsEditing(false);
        return;
      }

      const pathSegments = nodePath.split("."); // Split the path into segments
      let current = parsedJson;

      // Traverse the JSON object to find the target node
      for (let i = 0; i < pathSegments.length - 1; i++) {
        current = current[pathSegments[i]];
      }

      // Update the target node's key with the new label
      const lastSegment = pathSegments[pathSegments.length - 1];
      current[lastSegment] = draftLabel;

      // Stringify and update the JSON in the store
      setJson(JSON.stringify(parsedJson, null, 2));

      // Update the node's label and exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  const handleCancelEdit = () => {
    setDraftLabel(nodeProps.properties.text[0].key || "");
    setIsEditing(false);
  };

  return (
    <Node
      {...nodeProps}
      onClick={handleNodeClick as any}
      animated={false}
      label={null as any}
      onEnter={ev => {
        ev.currentTarget.style.stroke = "#3B82F6";
      }}
      onLeave={ev => {
        ev.currentTarget.style.stroke = colorScheme === "dark" ? "#424242" : "#BCBEC0";
      }}
      style={{
        fill: colorScheme === "dark" ? "#292929" : "#ffffff",
        stroke: colorScheme === "dark" ? "#424242" : "#BCBEC0",
        strokeWidth: 1,
      }}
    >
      {({ node, x, y }) => {
        const hasKey = nodeProps.properties.text[0].key;

        if (!hasKey) {
          return <TextNode node={nodeProps.properties as NodeData} x={x} y={y} />;
        }

        return (
          <foreignObject x={x - 75} y={y - 30} width={150} height={60}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={draftLabel}
                    onChange={e => setDraftLabel(e.target.value)}
                    style={{
                      width: "100%",
                      marginBottom: "8px",
                      padding: "4px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  <div>
                    <button
                      onClick={handleSaveLocalChange}
                      style={{
                        marginRight: "8px",
                        padding: "4px 8px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span>{nodeProps.properties.text[0].key}</span>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      marginTop: "8px",
                      padding: "4px 8px",
                      backgroundColor: "#007BFF",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </foreignObject>
        );
      }}
    </Node>
  );
};

export const CustomNode = React.memo(CustomNodeWrapper);
