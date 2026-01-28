import { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../services/api'; // Adjust path as needed

function GraphRoutes() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/flights/busiest');
      const flights = res.data;

      const nodesSet = new Set();
      const links = [];

      flights.forEach(route => {
        nodesSet.add(route.origin);
        nodesSet.add(route.destination);
        links.push({
          source: route.origin,
          target: route.destination,
          value: route.count,
          minPrice: route.minPrice,
          avgStops: route.avgStops,
          bestScore: route.bestScore,
        });
      });

      const nodes = Array.from(nodesSet).map(code => ({ id: code }));

      setGraphData({ nodes, links });
    } catch (err) {
      console.error('Error fetching busiest routes:', err);
    }
  };

  useEffect(() => {
    // Fetch only when admin triggers a refresh (no automatic fetch by default).
    const handler = (e) => {
      if (e?.detail?.key === 'busiestRoutes') fetchRoutes();
    };
    window.addEventListener('admin:refresh', handler);
    return () => window.removeEventListener('admin:refresh', handler);
  }, []);

  return (
    <div className="h-[600px] overflow-hidden border rounded shadow bg-white">
      <ForceGraph2D
        graphData={graphData}
        nodeId="id"
        nodeAutoColorBy="id"
        linkWidth={link => Math.log(link.value + 1)}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkLabel={link =>
          `Count: ${link.value}\nMin Price: $${link.minPrice}\nAvg Stops: ${link.avgStops}\nBest Score: ${link.bestScore}`
        }
        linkCurvature={link => {
          const reverse = graphData.links.find(
            other =>
              other.source === link.target &&
              other.target === link.source
          );
          return reverse ? 0.25 : 0;
        }}
        nodeCanvasObjectMode={() => 'before'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.id;
          const fontSize = 12 / globalScale;

          ctx.beginPath();
          ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();

          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000';
          ctx.fillText(label, node.x, node.y - 10);
        }}
      />
    </div>
  );
}

export default GraphRoutes;
